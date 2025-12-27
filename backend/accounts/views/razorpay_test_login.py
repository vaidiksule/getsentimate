import json

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
                print(f"Test login failed: User {email} not found")
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

            # Verify password (handles both Django hashes and raw bcrypt hashes)
            import bcrypt

            stored_hash = user.password
            is_valid = False

            try:
                if stored_hash.startswith(("$2a$", "$2b$")):
                    # Check as raw bcrypt
                    is_valid = bcrypt.checkpw(
                        password.encode("utf-8"), stored_hash.encode("utf-8")
                    )
                else:
                    # Check via standard Django hasher
                    is_valid = user.check_password(password)
            except Exception as e:
                print(f"Password check error: {e}")
                is_valid = False

            if not is_valid:
                print(f"Test login failed: Invalid password for {email}")
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Log in user (Session)
            from ..backends import login as mongo_login

            mongo_login(request, user)
            request.session.save()
            session_id = request.session.session_key

            # Create JWT tokens (identical to Google login)
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "session_id": session_id,
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
