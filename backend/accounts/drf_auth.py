from rest_framework.authentication import BaseAuthentication
from django.contrib.auth.models import AnonymousUser


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
