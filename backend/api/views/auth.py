from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework_simplejwt.tokens import RefreshToken
import os

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticates a user with a Google ID token.
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

        # Create or update user
        user, created = User.objects.get_or_create(email=email, defaults={'username': email, 'first_name': name})
        # Basic profile update; consider a separate UserProfile model
        user.first_name = name
        user.save()

        # Generate JWTs
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response({
            'access': access_token,
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.first_name,
                'avatar': picture,
             }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        # Invalid token
        print(f"ValueError: {e}")
        return Response({'error': 'Invalid ID token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        # Handle other exceptions
        print(f"Exception: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_me(request):
    """
    Returns the current user's information.
    """
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'name': user.first_name,
    }, status=status.HTTP_200_OK)
