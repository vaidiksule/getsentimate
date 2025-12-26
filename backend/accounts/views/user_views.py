from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from credits.models import MongoCreditAccount, MongoCreditTransaction


class CurrentUserView(APIView):
    """Get current user info"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            # Fetch credits
            credits = 0
            credit_account = MongoCreditAccount.objects(user=user).first()
            if credit_account:
                credits = credit_account.balance
            else:
                # Retro fix
                credit_account = MongoCreditAccount(user=user, balance=10)
                credit_account.save()

                MongoCreditTransaction(
                    user=user,
                    amount=10,
                    balance_after=10,
                    transaction_type="INIT_FIX",
                    description="Welcome Bonus (Delayed)",
                    reference="current_user_view_fix",
                ).save()
                credits = 10

            return Response(
                {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "name": f"{user.first_name} {user.last_name}".strip(),
                    "avatar": user.profile_picture,
                    "google_sub": getattr(user, "google_sub", None),
                    "is_authenticated": True,
                    "credits": credits,
                }
            )
        except Exception as e:
            print(f"Failed to get user info: {e}")
            return Response(
                {"error": "Failed to get user info"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserProfileView(APIView):
    """User profile management"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            return Response(
                {
                    "user": {
                        "id": str(user.id),
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "profile_picture": user.profile_picture,
                        "is_active_channel": user.is_active_channel,
                        "date_joined": user.date_joined.isoformat()
                        if user.date_joined
                        else None,
                        "last_login": user.last_login.isoformat()
                        if user.last_login
                        else None,
                    }
                }
            )
        except Exception as e:
            print(f"Failed to get profile: {e}")
            return Response(
                {"error": "Failed to get profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request):
        import json

        try:
            user = request.user
            data = json.loads(request.body)

            # Update allowed fields
            if "first_name" in data:
                user.first_name = data["first_name"]
            if "last_name" in data:
                user.last_name = data["last_name"]
            if "profile_picture" in data:
                user.profile_picture = data["profile_picture"]
            if "is_active_channel" in data:
                user.is_active_channel = data["is_active_channel"]

            user.save()

            return Response(
                {
                    "message": "Profile updated successfully",
                    "user": {
                        "id": str(user.id),
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "profile_picture": user.profile_picture,
                        "is_active_channel": user.is_active_channel,
                    },
                }
            )

        except Exception as e:
            print(f"Failed to update profile: {e}")
            return Response(
                {"error": "Failed to update profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
