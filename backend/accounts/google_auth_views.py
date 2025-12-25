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

    return redirect(
        "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    )


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
        return user

    user = MongoUser.objects(google_email=email).first()
    if user:
        user.google_sub = google_sub
        user.profile_picture = picture
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.save()
        return user

    base_username = email.split("@")[0]
    username = base_username
    i = 1
    while MongoUser.objects(username=username).first():
        username = f"{base_username}{i}"
        i += 1

    return MongoUser.objects.create(
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

    return Response(
        {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "name": f"{user.first_name} {user.last_name}".strip(),
            "avatar": user.profile_picture,
            "google_sub": user.google_sub,
            "is_authenticated": True,
        }
    )


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
