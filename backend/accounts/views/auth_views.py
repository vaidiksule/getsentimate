import json
from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from ..models import MongoUser, MongoUserPreference
from ..backends import MongoBackend


class RegisterView(APIView):
    """Register a new user with email/password"""

    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get("username")
            email = data.get("email")
            password = data.get("password")

            if not all([username, email, password]):
                return Response(
                    {"error": "Username, email, and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if user already exists
            if MongoUser.objects(username=username).first():
                return Response(
                    {"error": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if MongoUser.objects(email=email).first():
                return Response(
                    {"error": "Email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create user
            user = MongoUser(username=username, email=email, is_active=True)
            user.set_password(password)
            user.save()

            # Create default preferences
            try:
                MongoUserPreference.objects.create(user=user)
            except Exception:
                pass

            # Create initial credit account
            from credits.utils import add_credits

            add_credits(user, 20, "INIT", "signup_bonus")

            # Log in user
            login(request, user, backend="accounts.backends.MongoBackend")

            # Create JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Registration successful",
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
            print(e)
            return Response(
                {"error": "Registration failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LoginView(APIView):
    """Login with email/password"""

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

            # Authenticate user
            backend = MongoBackend()
            user = backend.authenticate(request, email=email, password=password)

            if not user:
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Log in user
            login(request, user, backend="accounts.backends.MongoBackend")

            # Create JWT tokens
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
            print(f"Login failed: {e}")
            return Response(
                {"error": "Login failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """Logout user"""

    permission_classes = []

    def post(self, request):
        try:
            logout(request)
            return Response({"message": "Logout successful"})
        except Exception as e:
            print(f"Logout failed: {e}")
            return Response(
                {"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
