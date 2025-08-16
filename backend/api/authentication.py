from rest_framework import authentication
from rest_framework import exceptions
from .jwt_utils import verify_jwt_token

class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication for DRF
    """
    
    def authenticate(self, request):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            raise exceptions.AuthenticationFailed('Invalid or expired token')
        
        # Create a user-like object for DRF
        user = type('User', (), {
            'id': payload['user_id'],
            'google_id': payload['google_id'],
            'email': payload['email'],
            'is_authenticated': True
        })()
        
        return (user, None)
