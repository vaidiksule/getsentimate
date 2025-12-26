import secrets
import requests
from urllib.parse import urlencode

from django.conf import settings
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import MongoUser
from .backends import login as mongo_login

# Import Credits models
from credits.models import MongoCreditAccount, MongoCreditTransaction


# -------------------------------------------------------------------
# Utils
# -------------------------------------------------------------------


def generate_state():
    return secrets.token_urlsafe(32)


def verify_id_token(id_token):
    """DEV MODE – no signature verification"""
    try:
        import jwt

        decoded = jwt.decode(id_token, options={"verify_signature": False})
        return {
            "sub": decoded.get("sub"),
            "email": decoded.get("email"),
            "name": decoded.get("name", ""),
            "picture": decoded.get("picture"),
        }
    except Exception as e:
        print("ID token decode failed:", e)
        return None


def exchange_code_for_tokens(code, request):
    callback_url = f"{request.scheme}://{request.get_host()}/api/auth/google/callback/"
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": callback_url,
    }
    res = requests.post("https://oauth2.googleapis.com/token", data=data)
    res.raise_for_status()
    return res.json()


# -------------------------------------------------------------------
# OAuth Start
# -------------------------------------------------------------------


def google_oauth_login(request):
    state = generate_state()
    request.session["oauth_state"] = state

    callback_url = f"{request.scheme}://{request.get_host()}/api/auth/google/callback/"
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": callback_url,
        "scope": "openid email profile",
        "response_type": "code",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }

    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


# -------------------------------------------------------------------
# OAuth Callback
# -------------------------------------------------------------------


@csrf_exempt
def google_oauth_callback(request):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    state = request.GET.get("state")
    stored_state = request.session.get("oauth_state")

    if not state or state != stored_state:
        return JsonResponse({"error": "Invalid OAuth state"}, status=400)

    request.session.pop("oauth_state", None)

    code = request.GET.get("code")
    if not code:
        return JsonResponse({"error": "Missing auth code"}, status=400)

    try:
        token_data = exchange_code_for_tokens(code, request)
        user_info = verify_id_token(token_data.get("id_token"))

        if not user_info:
            return JsonResponse({"error": "Invalid ID token"}, status=400)

        user = create_or_get_user(user_info, token_data.get("refresh_token"))

        # 🔐 Mongo session login
        mongo_login(request, user)
        request.session.save()

        return redirect(settings.FRONTEND_AFTER_LOGIN)

    except Exception as e:
        print("OAuth callback error:", e)
        return JsonResponse({"error": "OAuth failed"}, status=500)


# -------------------------------------------------------------------
# User creation
# -------------------------------------------------------------------


def create_or_get_user(user_info, refresh_token=None):
    google_sub = user_info["sub"]
    email = user_info["email"]
    name = user_info.get("name", "")
    picture = user_info.get("picture", "")

    user = MongoUser.objects(google_sub=google_sub).first()
    if user:
        user.google_email = email
        user.profile_picture = picture
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.save()

        # Ensure credit account exists for existing users (migration fallback)
        if not MongoCreditAccount.objects(user=user).first():
            account = MongoCreditAccount(
                user=user, balance=0
            )  # No bonus for existing users just to be safe, or 10 if you prefer
            account.save()

        return user

    user = MongoUser.objects(google_email=email).first()
    if user:
        user.google_sub = google_sub
        user.profile_picture = picture
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.save()

        # Ensure credit account exists
        if not MongoCreditAccount.objects(user=user).first():
            account = MongoCreditAccount(user=user, balance=0)
            account.save()

        return user

    base_username = email.split("@")[0]
    username = base_username
    i = 1
    while MongoUser.objects(username=username).first():
        username = f"{base_username}{i}"
        i += 1

    new_user = MongoUser.objects.create(
        username=username,
        email=email,
        google_sub=google_sub,
        google_email=email,
        profile_picture=picture,
        first_name=name.split(" ")[0] if name else "",
        last_name=" ".join(name.split(" ")[1:]) if len(name.split(" ")) > 1 else "",
        google_refresh_token=refresh_token,
        is_active=True,
    )

    # 🎁 BONUS: 10 Free Credits for new users
    initial_credits = 10
    credit_account = MongoCreditAccount(user=new_user, balance=initial_credits)
    credit_account.save()

    MongoCreditTransaction(
        user=new_user,
        amount=initial_credits,
        balance_after=initial_credits,
        transaction_type="INIT",
        description="Welcome Bonus",
        reference="signup_bonus",
    ).save()

    return new_user


# -------------------------------------------------------------------
# Auth ME
# -------------------------------------------------------------------


@api_view(["GET"])
@permission_classes([AllowAny])
def auth_me(request):
    user = request.user

    if not user or isinstance(user, AnonymousUser):
        return Response(
            {"error": "Not authenticated"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Fetch credits (with self-healing for missing welcome bonus)
    credits = 0
    credit_account = MongoCreditAccount.objects(user=user).first()

    if not credit_account:
        # HEADS UP: User existed but had no credit account. Fix it.
        # Retroactive welcome bonus
        credit_account = MongoCreditAccount(user=user, balance=10)
        credit_account.save()

        MongoCreditTransaction(
            user=user,
            amount=10,
            balance_after=10,
            transaction_type="INIT_FIX",
            description="Welcome Bonus (Delayed)",
            reference="auth_me_fix",
        ).save()
        credits = 10
        print(f"DEBUG: Created missing credit account for {user.email} with 10 credits")
    else:
        # Check if they have 0 credits and NO transactions (meaning they were created before bonuses existed)
        # This handles the specific case of your account which might have been created before the patch
        transaction_count = MongoCreditTransaction.objects(user=user).count()
        if credit_account.balance == 0 and transaction_count == 0:
            # Retroactively apply welcome bonus
            credit_account.balance = 10
            credit_account.save()

            MongoCreditTransaction(
                user=user,
                amount=10,
                balance_after=10,
                transaction_type="RETRO_BONUS",
                description="Welcome Bonus (Retroactive)",
                reference="auth_me_retro",
            ).save()
            credits = 10
            print(f"DEBUG: Retroactively applied bonus for {user.email}")
        else:
            credits = credit_account.balance
            print(f"DEBUG: Found account for {user.email}, balance: {credits}")

    response_data = {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}".strip(),
        "avatar": user.profile_picture,
        "google_sub": user.google_sub,
        "is_authenticated": True,
        "credits": credits,
    }
    print(f"DEBUG: auth_me returning: {response_data}")
    return Response(response_data)


# -------------------------------------------------------------------
# Logout
# -------------------------------------------------------------------


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def auth_logout(request):
    request.session.flush()
    request.user = AnonymousUser()
    return Response({"message": "Logged out"})
