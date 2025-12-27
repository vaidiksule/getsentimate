from rest_framework.authentication import BaseAuthentication
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from accounts.models import MongoUser


class MongoSessionAuthentication(BaseAuthentication):
    """
    DRF authentication that trusts MongoAuthMiddleware.
    NEVER touch request.user here.
    """

    def authenticate(self, request):
        # ⚠️ CRITICAL: always read from raw Django request
        django_request = request._request

        user = getattr(django_request, "user", None)

        if user and not isinstance(user, AnonymousUser):
            return (user, None)

        return None


class MongoJWTAuthentication(JWTAuthentication):
    """
    SimpleJWT authentication customized for MongoUser.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None  # Fall back to session auth

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
            user = MongoUser.objects(id=user_id).first()
            if user is None:
                raise AuthenticationFailed("User not found", code="user_not_found")
            return user
        except Exception as e:
            raise InvalidToken(str(e))
