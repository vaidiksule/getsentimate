import os
import jwt
import datetime

# Secret key for JWT tokens (in production, use environment variable)
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')

def create_jwt_token(user_data):
    """Create JWT token for user"""
    payload = {
        'user_id': str(user_data['_id']),  # Convert ObjectId to string
        'google_id': user_data['google_id'],
        'email': user_data['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
