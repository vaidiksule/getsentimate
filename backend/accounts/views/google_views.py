import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import MongoUser, MongoUserPreference
from ..backends import MongoBackend


class GoogleAuthView(APIView):
    """Google OAuth"""

    permission_classes = []

    @csrf_exempt
    def post(self, request):
        try:
            data = json.loads(request.body)
            token = data.get("token")

            if not token:
                return Response(
                    {"error": "Google token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Decode Google token
            from ..google_auth_views import verify_id_token

            user_info = verify_id_token(token)

            if not user_info:
                return Response(
                    {"error": "Invalid Google token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Extract user information
            google_id = user_info.get("sub")
            google_email = user_info.get("email")
            name = user_info.get("name", "")
            profile_picture = user_info.get("picture", "")

            # Find or create user
            backend = MongoBackend()
            user = backend.authenticate_google(
                google_sub=google_id, google_email=google_email
            )

            if not user:
                # Create new user
                username = google_email.split("@")[0]
                base_username = username
                counter = 1

                while MongoUser.objects(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = MongoUser.objects.create(
                    username=username,
                    email=google_email,
                    google_sub=google_id,
                    google_email=google_email,
                    profile_picture=profile_picture,
                    first_name=name.split(" ")[0] if name else "",
                    last_name=" ".join(name.split(" ")[1:])
                    if name and len(name.split(" ")) > 1
                    else "",
                    is_active=True,
                )

                # Create default preferences
                try:
                    MongoUserPreference.objects.create(user=user)
                except Exception:
                    pass

                # Create initial credit account
                from credits.utils import add_credits

                add_credits(user, 20, "INIT", "signup_bonus")

            # Update user profile picture if changed
            if profile_picture and user.profile_picture != profile_picture:
                user.profile_picture = profile_picture
                user.save()

            # Log in user
            login(request, user, backend="accounts.backends.MongoBackend")

            # Create JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Authentication successful",
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "user": {
                        "id": str(user.id),
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "profile_picture": user.profile_picture,
                    },
                }
            )

        except Exception as e:
            print(f"Authentication failed: {e}")
            return Response(
                {"error": "Authentication failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GoogleAuthCallbackView(APIView):
    """Google OAuth callback (for web flow)"""

    permission_classes = []

    def get(self, request):
        # This would handle the redirect from Google OAuth
        # For now, return an error indicating this endpoint is not implemented
        return Response(
            {"error": "Web OAuth flow not implemented. Use token-based flow."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
