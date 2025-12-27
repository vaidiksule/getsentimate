from accounts.backends import get_user
from django.conf import settings
import importlib


class MongoAuthMiddleware:
    """
    Sets request.user exactly ONCE per request.
    Supports session lookup via 'X-Session-ID' header for cross-domain requests.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Check for X-Session-ID header (fallback for cross-domain cookies)
        session_id = request.headers.get("X-Session-ID")
        if session_id and not request.COOKIES.get(settings.SESSION_COOKIE_NAME):
            # Manually load session if cookie is missing but header is present
            engine = importlib.import_module(settings.SESSION_ENGINE)
            request.session = engine.SessionStore(session_id)

        request.user = get_user(request)
        return self.get_response(request)
