import json
import bcrypt
from django.contrib.auth import login
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import MongoUser


class RazorpayTestLoginView(APIView):
    """
    TEMPORARY: Login with email/password for Razorpay verification.
    This view is designed for deletion after verification.
    """

    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not all([email, password]):
                return Response(
                    {"error": "Email and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find user
            user = MongoUser.objects(email=email).first()

            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Rule: Only users with auth_provider === "local" can log in here
            if user.auth_provider == "google":
                return Response(
                    {
                        "error": "This account uses Google Login. Please sign in with Google."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if user.auth_provider != "local":
                return Response(
                    {"error": "Invalid auth provider"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Verify password using bcrypt
            # Note: We expect the password in DB to be hashed with bcrypt
            stored_hash = user.password.encode("utf-8")
            if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Log in user (Session)
            login(request, user, backend="accounts.backends.MongoBackend")

            # Create JWT tokens (identical to Google login)
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
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
            print(f"Razorpay test login failed: {e}")
            return Response(
                {"error": "Login failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
