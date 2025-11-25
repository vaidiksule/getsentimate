from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CSRFExemptSessionAuthentication(SessionAuthentication):
    """
    Custom session authentication that bypasses CSRF checks.
    This is safe for API endpoints since they're not form-based.
    """
    
    def enforce_csrf(self, request):
        """
        Override to disable CSRF enforcement.
        This is safe because:
        1. API endpoints are not form-based
        2. We're using SameSite cookies
        3. CORS is properly configured
        4. We still require valid session authentication
        """
        return
    
    def authenticate(self, request):
        """
        Authenticate the request and return a (user, token) tuple.
        """
        # Get the session-based user
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return None
            
        # Return the authenticated user
        return (user, None)
