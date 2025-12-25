import json
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
from django.contrib.auth.models import AnonymousUser
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils import timezone

from .models import MongoUser, MongoUserPreference
from .backends import MongoBackend


class RegisterView(APIView):
    """Register a new user with email/password"""
    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            if not all([username, email, password]):
                return Response(
                    {'error': 'Username, email, and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if user already exists
            if MongoUser.objects(username=username).first():
                return Response(
                    {'error': 'Username already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if MongoUser.objects(email=email).first():
                return Response(
                    {'error': 'Email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create user
            user = MongoUser(
                username=username,
                email=email,
                is_active=True
            )
            user.set_password(password)
            user.save()

            # Create default preferences
            try:
                MongoUserPreference.objects.create(user=user)
            except Exception:
                pass

            # Create initial credit account
            from credits.utils import add_credits
            add_credits(user, 20, 'INIT', 'signup_bonus')

            # Log in user
            login(request, user, backend='accounts.backends.MongoBackend')

            # Create JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Registration successful',
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Registration failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    """Login with email/password"""
    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not all([email, password]):
                return Response(
                    {'error': 'Email and password are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Authenticate user
            backend = MongoBackend()
            user = backend.authenticate(request, email=email, password=password)

            if not user:
                return Response(
                    {'error': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Log in user
            login(request, user, backend='accounts.backends.MongoBackend')

            # Create JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Login successful',
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Login failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """Logout user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logout(request)
            return Response({'message': 'Logout successful'})
        except Exception as e:
            return Response(
                {'error': 'Logout failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CurrentUserView(APIView):
    """Get current user info"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            return Response({
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip(),
                'avatar': user.profile_picture,
                'google_sub': getattr(user, 'google_sub', None),
                'is_authenticated': True,
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to get user info'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleAuthView(APIView):
    """Google OAuth"""
    permission_classes = []

    @csrf_exempt
    def post(self, request):
        try:
            data = json.loads(request.body)
            token = data.get('token')

            if not token:
                return Response(
                    {'error': 'Google token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decode Google token
            from .google_auth_views import verify_id_token
            user_info = verify_id_token(token)

            if not user_info:
                return Response(
                    {'error': 'Invalid Google token'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Extract user information
            google_id = user_info.get('sub')
            google_email = user_info.get('email')
            name = user_info.get('name', '')
            profile_picture = user_info.get('picture', '')

            # Find or create user
            backend = MongoBackend()
            user = backend.authenticate_google(google_sub=google_id, google_email=google_email)

            if not user:
                # Create new user
                username = google_email.split('@')[0]
                base_username = username
                counter = 1

                while MongoUser.objects(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = MongoUser.objects.create(
                    username=username,
                    email=google_email,
                    google_sub=google_id,
                    google_email=google_email,
                    profile_picture=profile_picture,
                    first_name=name.split(' ')[0] if name else '',
                    last_name=' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
                    is_active=True
                )

                # Create default preferences
                try:
                    MongoUserPreference.objects.create(user=user)
                except Exception:
                    pass

                # Create initial credit account
                from credits.utils import add_credits
                add_credits(user, 20, 'INIT', 'signup_bonus')

            # Update user profile picture if changed
            if profile_picture and user.profile_picture != profile_picture:
                user.profile_picture = profile_picture
                user.save()

            # Log in user
            login(request, user, backend='accounts.backends.MongoBackend')

            # Create JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Authentication successful',
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleAuthCallbackView(APIView):
    """Google OAuth callback (for web flow)"""
    permission_classes = []

    def get(self, request):
        # This would handle the redirect from Google OAuth
        # For now, return an error indicating this endpoint is not implemented
        return Response(
            {'error': 'Web OAuth flow not implemented. Use token-based flow.'},
            status=status.HTTP_501_NOT_IMPLEMENTED
        )


class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            return Response({
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                    'is_active_channel': user.is_active_channel,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                }
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to get profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        try:
            user = request.user
            data = json.loads(request.body)

            # Update allowed fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'profile_picture' in data:
                user.profile_picture = data['profile_picture']
            if 'is_active_channel' in data:
                user.is_active_channel = data['is_active_channel']

            user.save()

            return Response({
                'message': 'Profile updated successfully',
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'profile_picture': user.profile_picture,
                    'is_active_channel': user.is_active_channel,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Failed to update profile'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserPreferencesView(APIView):
    """User preferences management"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            preferences = MongoUserPreference.objects(user=user).first()

            if not preferences:
                # Create default preferences
                preferences = MongoUserPreference.objects.create(user=user)

            return Response({
                'preferences': {
                    'default_channel': preferences.default_channel,
                    'videos_per_page': preferences.videos_per_page,
                    'auto_refresh_enabled': preferences.auto_refresh_enabled,
                    'refresh_interval': preferences.refresh_interval,
                    'default_analysis_type': preferences.default_analysis_type,
                    'include_toxicity_analysis': preferences.include_toxicity_analysis,
                    'save_analysis_history': preferences.save_analysis_history,
                    'email_notifications': preferences.email_notifications,
                    'analysis_complete_notifications': preferences.analysis_complete_notifications,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Failed to get preferences'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        try:
            user = request.user
            data = json.loads(request.body)

            preferences = MongoUserPreference.objects(user=user).first()
            if not preferences:
                preferences = MongoUserPreference.objects.create(user=user)

            # Update allowed fields
            if 'default_channel' in data:
                preferences.default_channel = data['default_channel']
            if 'videos_per_page' in data:
                preferences.videos_per_page = data['videos_per_page']
            if 'auto_refresh_enabled' in data:
                preferences.auto_refresh_enabled = data['auto_refresh_enabled']
            if 'refresh_interval' in data:
                preferences.refresh_interval = data['refresh_interval']
            if 'default_analysis_type' in data:
                preferences.default_analysis_type = data['default_analysis_type']
            if 'include_toxicity_analysis' in data:
                preferences.include_toxicity_analysis = data['include_toxicity_analysis']
            if 'save_analysis_history' in data:
                preferences.save_analysis_history = data['save_analysis_history']
            if 'email_notifications' in data:
                preferences.email_notifications = data['email_notifications']
            if 'analysis_complete_notifications' in data:
                preferences.analysis_complete_notifications = data['analysis_complete_notifications']

            preferences.save()

            return Response({
                'message': 'Preferences updated successfully',
                'preferences': {
                    'default_channel': preferences.default_channel,
                    'videos_per_page': preferences.videos_per_page,
                    'auto_refresh_enabled': preferences.auto_refresh_enabled,
                    'refresh_interval': preferences.refresh_interval,
                    'default_analysis_type': preferences.default_analysis_type,
                    'include_toxicity_analysis': preferences.include_toxicity_analysis,
                    'save_analysis_history': preferences.save_analysis_history,
                    'email_notifications': preferences.email_notifications,
                    'analysis_complete_notifications': preferences.analysis_complete_notifications,
                }
            })

        except Exception as e:
            return Response(
                {'error': 'Failed to update preferences'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
