from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from google.oauth2 import id_token
from google.auth.transport import requests
from ..services.mongodb_service import MongoDBService
from ..jwt_utils import create_jwt_token, verify_jwt_token
import os

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticates a user with a Google ID token.
    Creates/updates user in MongoDB and returns JWT token.
    """
    try:
        id_token_str = request.data.get('id_token')
        if not id_token_str:
            return Response({'error': 'Missing ID token'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(id_token_str, requests.Request(), os.environ.get('GOOGLE_CLIENT_ID'))

        # Get user info from token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo['name']
        picture = idinfo.get('picture')

        # Create or update user in MongoDB
        mongo_service = MongoDBService()
        user_data = {
            'google_id': google_id,
            'name': name,
            'email': email,
            'avatar': picture
        }

        
        mongo_user = mongo_service.create_or_update_user(user_data)
        mongo_service.close_connection()

        # Create JWT token
        token = create_jwt_token(mongo_user)

        return Response({
            'token': token,
            'user': {
                'id': str(mongo_user['_id']),
                'email': mongo_user['email'],
                'name': mongo_user['name'],
                'avatar': mongo_user['avatar'],
                'google_id': mongo_user['google_id'],
                'credits': mongo_user['credits']
             }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        print(f"ValueError: {e}")
        return Response({'error': 'Invalid ID token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Exception: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_me(request):
    """
    Returns the current user's information from JWT token.
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'No valid token provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if not payload:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get user data from MongoDB
        mongo_service = MongoDBService()
        user_data = mongo_service.get_user_by_google_id(payload['google_id'])
        mongo_service.close_connection()
        
        if not user_data:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'id': str(user_data['_id']),
            'email': user_data['email'],
            'name': user_data['name'],
            'avatar': user_data['avatar'],
            'google_id': user_data['google_id'],
            'credits': user_data['credits']
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
