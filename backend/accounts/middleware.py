from django.contrib.auth.models import AnonymousUser
from accounts.backends import get_user


class MongoAuthMiddleware:
    """
    Sets request.user exactly ONCE per request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user = get_user(request)
        return self.get_response(request)
