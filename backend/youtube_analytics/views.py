import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User, Channel, Video, Comment, AnalysisResult, UserPreference
from .serializers import (
    UserSerializer, ChannelSerializer, VideoSerializer, CommentSerializer,
    AnalysisResultSerializer, UserPreferenceSerializer, VideoDetailSerializer,
    ChannelDetailSerializer, CommentAnalysisSerializer, ChannelConnectionSerializer
)
from .services.youtube_api_service import YouTubeAPIService
from .services.ai_service import ai_service
from django.utils import timezone
from datetime import datetime

# Import MongoDB service for user creation
from .services.mongo_service import MongoService


class AuthView(APIView):
    """Authentication views for Google OAuth"""
    
    permission_classes = []  # No authentication required for login
    
    @csrf_exempt
    def post(self, request, action=None):
        """Handle authentication actions"""
        if action == 'google':
            return self.google_oauth(request)
        elif action == 'youtube_oauth':
            return self.youtube_oauth(request)
        elif action == 'fetch_videos':
            return self.fetch_videos(request)
        elif action == 'refresh':
            return self.refresh_token(request)
        elif action == 'logout':
            return self.logout(request)
        elif action == 'disconnect_youtube':
            return self.disconnect_youtube(request)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def google_oauth(self, request):
        """Handle Google OAuth login"""
        try:
            data = json.loads(request.body)
            id_token = data.get('id_token')
            
            if not id_token:
                return Response(
                    {'error': 'Missing Google ID token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Processing Google OAuth for token: {id_token[:20]}...")  # Debug log
            
            # For now, we'll use a simple approach - extract email from token
            # In production, you should verify the JWT token with Google
            try:
                # Decode the JWT token (this is a simplified approach)
                import jwt
                # Note: In production, verify the token with Google's public keys
                decoded = jwt.decode(id_token, options={"verify_signature": False})
                
                google_id = decoded.get('sub')  # Google's user ID
                google_email = decoded.get('email')
                profile_picture = decoded.get('picture')
                name = decoded.get('name', '')
                
                print(f"Decoded token - ID: {google_id}, Email: {google_email}")  # Debug log
                
                if not all([google_id, google_email]):
                    return Response(
                        {'error': 'Invalid Google token data'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                print(f"Token decode error: {str(e)}")  # Debug log
                return Response(
                    {'error': f'Failed to decode Google token: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to get existing user
            try:
                user = User.objects.get(google_id=google_id)
                print(f"Found existing user: {user.username}")  # Debug log
            except User.DoesNotExist:
                try:
                    user = User.objects.get(google_email=google_email)
                    print(f"Found user by email: {user.username}")  # Debug log
                    # Update with new google_id if different
                    user.google_id = google_id
                except User.DoesNotExist:
                    print(f"Creating new user for: {google_email}")  # Debug log
                    # Create new user
                    username = google_email.split('@')[0]
                    # Ensure unique username
                    base_username = username
                    counter = 1
                    while User.objects.filter(username=username).exists():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    try:
                        user = User.objects.create_user(
                            username=username,
                            email=google_email,
                            first_name=name.split(' ')[0] if name else '',
                            last_name=' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
                            google_id=google_id,
                            google_email=google_email,
                            profile_picture=profile_picture
                        )
                        print(f"Created new user: {user.username}")  # Debug log
                        
                        # Create default preferences (with error handling)
                        try:
                            UserPreference.objects.create(user=user)
                            print(f"Created preferences for user: {user.username}")  # Debug log
                        except Exception as pref_error:
                            print(f"Warning: Could not create preferences: {str(pref_error)}")  # Debug log
                            # Continue without preferences - not critical
                        
                    except Exception as create_error:
                        print(f"User creation error: {str(create_error)}")  # Debug log
                        return Response(
                            {'error': f'Failed to create user: {str(create_error)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            
            # Update user data
            try:
                user.profile_picture = profile_picture
                user.save()
                print(f"Updated user profile: {user.username}")  # Debug log
            except Exception as save_error:
                print(f"Warning: Could not update profile: {str(save_error)}")  # Debug log
            
            # Create/Update MongoDB user
            try:
                mongo_user_data = {
                    'django_user_id': user.id,
                    'google_id': google_id,
                    'google_email': google_email,
                    'profile_picture': profile_picture,
                    'created_at': timezone.now(),
                    'updated_at': timezone.now()
                }
                
                mongo_user = MongoService.create_or_update_user(user.id, mongo_user_data)
                print(f"✅ Created/Updated MongoDB user for: {user.username}")
                
            except Exception as mongo_error:
                print(f"⚠️  Warning: MongoDB user creation failed: {str(mongo_error)}")
                # Continue without MongoDB user - not critical for authentication
            
            # Generate JWT tokens
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                print(f"Generated JWT token for user: {user.username}")  # Debug log
            except Exception as token_error:
                print(f"Token generation error: {str(token_error)}")  # Debug log
                return Response(
                    {'error': f'Failed to generate authentication token: {str(token_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Get user data
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'avatar': user.profile_picture,
                'google_id': user.google_id,
            }
            
            print(f"Authentication successful for user: {user.username}")  # Debug log
            
            return Response({
                'access': access_token,  # Changed from 'token' to 'access' to match frontend
                'user': user_data,
                'message': 'Successfully authenticated with MongoDB integration'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as json_error:
            print(f"JSON decode error: {str(json_error)}")  # Debug log
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Unexpected authentication error: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full stack trace
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def youtube_oauth(self, request):
        """Handle YouTube OAuth for channel access"""
        try:
            data = json.loads(request.body)
            authorization_code = data.get('authorization_code')
            
            if not authorization_code:
                return Response(
                    {'error': 'Missing YouTube authorization code'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user from JWT token in Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
                
                token = auth_header.split(' ')[1]
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                
                # Get user from database
                user = User.objects.get(id=user_id)
                print(f"YouTube OAuth - Authenticated user: {user.username}")
                
            except (InvalidToken, TokenError, User.DoesNotExist) as e:
                print(f"Authentication error: {str(e)}")
                return Response(
                    {'error': 'Invalid or expired token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            print(f"YouTube OAuth - Starting token exchange for user: {user.username}")  # Debug log
            
            # Exchange authorization code for tokens
            try:
                import requests
                
                client_id = os.getenv('GOOGLE_CLIENT_ID')
                client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
                
                if not client_id or not client_secret:
                    return Response({
                        'error': 'Google OAuth configuration missing. Please check backend configuration.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Exchange code for tokens
                # Use the same redirect URI that was used in the frontend OAuth flow
                # This should match what's configured in Google Cloud Console
                base_frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
                redirect_uri = f"{base_frontend_url}/youtube-callback"
                token_response = requests.post('https://oauth2.googleapis.com/token', {
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': authorization_code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': redirect_uri
                })
                
                if token_response.status_code != 200:
                    print(f"Token exchange failed: {token_response.text}")  # Debug log
                    return Response({
                        'error': 'Failed to exchange authorization code for tokens'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                token_data = token_response.json()
                access_token = token_data.get('access_token')
                refresh_token = token_data.get('refresh_token')
                
                print(f"Token exchange successful - Access Token: {access_token[:20] if access_token else 'None'}...")  # Debug log
                print(f"Token exchange successful - Refresh Token: {refresh_token[:20] if refresh_token else 'None'}...")  # Debug log
                
                # Update user's YouTube tokens
                user.youtube_access_token = access_token
                if refresh_token:
                    user.youtube_refresh_token = refresh_token
                    print(f"Stored refresh token for user: {user.username}")  # Debug log
                else:
                    print(f"Warning: No refresh token received for user: {user.username}")  # Debug log
                
                try:
                    user.save()
                    print(f"Successfully saved YouTube tokens for user: {user.username}")  # Debug log
                    
                    # Update MongoDB user with YouTube tokens
                    try:
                        mongo_user_data = {
                            'youtube_access_token': access_token,
                            'youtube_refresh_token': refresh_token,
                            'updated_at': timezone.now()
                        }
                        MongoService.create_or_update_user(user.id, mongo_user_data)
                        print(f"✅ Updated MongoDB user with YouTube tokens for: {user.username}")
                    except Exception as mongo_error:
                        print(f"⚠️  Warning: MongoDB YouTube token update failed: {str(mongo_error)}")
                        # Continue without MongoDB update - not critical
                        
                except Exception as save_error:
                    print(f"Error saving YouTube tokens: {str(save_error)}")  # Debug log
                    return Response({
                        'error': f'Failed to save YouTube tokens: {str(save_error)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except Exception as token_exchange_error:
                print(f"Token exchange error: {str(token_exchange_error)}")  # Debug log
                return Response({
                    'error': f'Failed to exchange authorization code: {str(token_exchange_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Fetch user's YouTube channels
            try:
                from googleapiclient.discovery import build
                from google.oauth2.credentials import Credentials
                
                # Create credentials object with proper error handling
                client_id = os.getenv('GOOGLE_CLIENT_ID')
                client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
                
                if not client_id or not client_secret:
                    return Response({
                        'error': 'Google OAuth configuration missing. Please check backend configuration.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                credentials = Credentials(
                    access_token,
                    refresh_token=refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=client_id,
                    client_secret=client_secret,
                    scopes=[
                        'https://www.googleapis.com/auth/youtube.readonly',
                        'https://www.googleapis.com/auth/youtube.force-ssl',
                        'https://www.googleapis.com/auth/youtube'
                    ]
                )
                
                # Build YouTube API service
                youtube = build('youtube', 'v3', credentials=credentials)
                
                # Get user's channels
                channels_response = youtube.channels().list(
                    part='snippet,statistics',
                    mine=True
                ).execute()
                
                channels = []
                for channel_item in channels_response.get('items', []):
                    channel, created = Channel.objects.get_or_create(
                        id=channel_item['id'],
                        defaults={
                            'user': user,
                            'title': channel_item['snippet']['title'],
                            'description': channel_item['snippet'].get('description', ''),
                            'thumbnail_url': channel_item['snippet'].get('thumbnails', {}).get('default', {}).get('url', ''),
                            'subscriber_count': channel_item['statistics'].get('subscriberCount', 0),
                            'video_count': channel_item['statistics'].get('videoCount', 0),
                            'view_count': channel_item['statistics'].get('viewCount', 0),
                            'published_at': channel_item['snippet'].get('publishedAt'),
                            'is_connected': True
                        }
                    )
                    
                    if not created:
                        # Update existing channel
                        channel.title = channel_item['snippet']['title']
                        channel.description = channel_item['snippet'].get('description', '')
                        channel.thumbnail_url = channel_item['snippet'].get('thumbnails', {}).get('default', {}).get('url', '')
                        channel.subscriber_count = channel_item['statistics'].get('subscriberCount', 0)
                        channel.video_count = channel_item['statistics'].get('videoCount', 0)
                        channel.view_count = channel_item['statistics'].get('viewCount', 0)
                        channel.is_connected = True
                        channel.save()
                    
                    # Also store channel in MongoDB
                    try:
                        # Parse the published_at date properly
                        published_at_str = channel_item['snippet'].get('publishedAt')
                        published_at = None
                        if published_at_str:
                            try:
                                # Parse ISO 8601 date string from YouTube
                                from datetime import datetime
                                published_at = datetime.fromisoformat(published_at_str.replace('Z', '+00:00'))
                            except ValueError:
                                # Fallback: use current time if parsing fails
                                published_at = timezone.now()
                                print(f"⚠️  Could not parse published_at date: {published_at_str}, using current time")
                        
                        mongo_channel_data = {
                            'youtube_id': channel_item['id'],
                            'django_user_id': user.id,
                            'title': channel_item['snippet']['title'],
                            'description': channel_item['snippet'].get('description', ''),
                            'thumbnail_url': channel_item['snippet'].get('thumbnails', {}).get('default', {}).get('url', ''),
                            'subscriber_count': int(channel_item['statistics'].get('subscriberCount', 0)),
                            'video_count': int(channel_item['statistics'].get('videoCount', 0)),
                            'view_count': int(channel_item['statistics'].get('viewCount', 0)),
                            'published_at': published_at,
                            'is_connected': True,
                            'last_sync': timezone.now(),
                            'created_at': timezone.now()
                        }
                        
                        MongoService.create_or_update_channel(mongo_channel_data)
                        print(f"✅ Stored channel in MongoDB: {channel_item['snippet']['title']}")
                        
                    except Exception as mongo_error:
                        print(f"⚠️  Warning: MongoDB channel storage failed: {str(mongo_error)}")
                        # Continue without MongoDB storage - not critical
                    
                    channels.append(ChannelSerializer(channel).data)
                
                return Response({
                    'message': 'YouTube channels connected successfully',
                    'channels': channels,
                    'channel_count': len(channels)
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'error': f'Failed to fetch YouTube channels: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def fetch_videos(self, request):
        """Fetch videos from connected YouTube channels"""
        try:
            # Get user from request (they should be authenticated)
            user = request.user
            if not user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user has YouTube connected
            if not user.youtube_access_token:
                return Response(
                    {'error': 'YouTube not connected. Please connect your YouTube account first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user's connected channels
            channels = Channel.objects.filter(user=user, is_connected=True)
            if not channels.exists():
                return Response(
                    {'error': 'No connected channels found. Please connect your YouTube account first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                from googleapiclient.discovery import build
                from google.oauth2.credentials import Credentials
                
                # Create credentials object with proper error handling
                print(f"Fetching videos for user: {user.username}")  # Debug log
                print(f"User has access token: {bool(user.youtube_access_token)}")  # Debug log
                print(f"User has refresh token: {bool(user.youtube_refresh_token)}")  # Debug log
                
                if not user.youtube_refresh_token:
                    print(f"Warning: No refresh token for user: {user.username}")  # Debug log
                    return Response({
                        'error': 'YouTube refresh token not found. Please reconnect your YouTube account.',
                        'details': 'The refresh token is required for video fetching. Please disconnect and reconnect your YouTube account.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                client_id = os.getenv('GOOGLE_CLIENT_ID')
                client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
                
                if not client_id or not client_secret:
                    return Response({
                        'error': 'Google OAuth configuration missing. Please check backend configuration.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                credentials = Credentials(
                    user.youtube_access_token,
                    refresh_token=user.youtube_refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=client_id,
                    client_secret=client_secret,
                    scopes=['https://www.googleapis.com/auth/youtube.force-ssl']
                )
                
                # Build YouTube API service
                youtube = build('youtube', 'v3', credentials=credentials)
                
                all_videos = []
                
                for channel in channels:
                    # Get videos from this channel
                    videos_response = youtube.search().list(
                        part='snippet',
                        channelId=channel.id,
                        type='video',
                        order='date',
                        maxResults=50  # Get last 50 videos
                    ).execute()
                    
                    for video_item in videos_response.get('items', []):
                        video_id = video_item['id']['videoId']
                        
                        # Get detailed video information
                        video_detail_response = youtube.videos().list(
                            part='snippet,statistics,contentDetails',
                            id=video_id
                        ).execute()
                        
                        if video_detail_response.get('items'):
                            video_detail = video_detail_response['items'][0]
                            
                            # Create or update video record
                            video, created = Video.objects.get_or_create(
                                id=video_id,
                                defaults={
                                    'channel': channel,
                                    'title': video_detail['snippet']['title'],
                                    'description': video_detail['snippet'].get('description', ''),
                                    'thumbnail_url': video_detail['snippet'].get('thumbnails', {}).get('medium', {}).get('url', ''),
                                    'published_at': datetime.fromisoformat(
                                        video_detail['snippet']['publishedAt'].replace('Z', '+00:00')
                                    ) if video_detail['snippet'].get('publishedAt') else timezone.now(),
                                    'duration': video_detail['contentDetails'].get('duration', ''),
                                    'view_count': int(video_detail['statistics'].get('viewCount', 0)),
                                    'like_count': int(video_detail['statistics'].get('likeCount', 0)),
                                    'comment_count': int(video_detail['statistics'].get('commentCount', 0)),
                                    'category_id': video_detail['snippet'].get('categoryId', ''),
                                    'tags': video_detail['snippet'].get('tags', []),
                                    'language': video_detail['snippet'].get('defaultLanguage', ''),
                                    'comments_fetched': False,
                                    'comments_analyzed': False
                                }
                            )
                            
                            if not created:
                                # Update existing video
                                video.title = video_detail['snippet']['title']
                                video.description = video_detail['snippet'].get('description', '')
                                video.thumbnail_url = video_detail['snippet'].get('thumbnails', {}).get('medium', {}).get('url', '')
                                video.view_count = int(video_detail['statistics'].get('viewCount', 0))
                                video.like_count = int(video_detail['statistics'].get('likeCount', 0))
                                video.comment_count = int(video_detail['statistics'].get('commentCount', 0))
                                video.save()
                            
                            all_videos.append(VideoSerializer(video).data)
                
                return Response({
                    'message': f'Successfully fetched {len(all_videos)} videos',
                    'videos': all_videos,
                    'video_count': len(all_videos),
                    'channels_processed': channels.count()
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response({
                    'error': f'Failed to fetch videos: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            return Response({
                'error': f'Video fetching failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def refresh_token(self, request):
        """Refresh JWT token"""
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh_token')
            
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate refresh token
            try:
                refresh = RefreshToken(refresh_token)
                user = User.objects.get(id=refresh['user_id'])
                
                # Generate new access token
                new_access_token = str(refresh.access_token)
                
                return Response({
                    'access_token': new_access_token,
                    'message': 'Token refreshed successfully'
                }, status=status.HTTP_200_OK)
                
            except (InvalidToken, TokenError, User.DoesNotExist):
                return Response(
                    {'error': 'Invalid refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Token refresh failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def logout(self, request):
        """Logout user"""
        try:
            # Clear YouTube tokens from Django user if available
            if hasattr(request, 'user') and request.user.is_authenticated:
                try:
                    user = request.user
                    user.youtube_access_token = None
                    user.youtube_refresh_token = None
                    user.token_expiry = None
                    user.save()
                    
                    # Clear YouTube tokens from MongoDB user
                    try:
                        mongo_user_data = {
                            'youtube_access_token': None,
                            'youtube_refresh_token': None,
                            'token_expiry': None,
                            'updated_at': timezone.now()
                        }
                        MongoService.create_or_update_user(user.id, mongo_user_data)
                        print(f"✅ Cleared MongoDB user YouTube tokens for: {user.username}")
                    except Exception as mongo_error:
                        print(f"⚠️  Warning: MongoDB logout cleanup failed: {str(mongo_error)}")
                        # Continue without MongoDB cleanup - not critical
                        
                except Exception as user_error:
                    print(f"⚠️  Warning: User logout cleanup failed: {str(user_error)}")
            
            # In a real implementation, you might want to blacklist the token
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Logout failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def disconnect_youtube(self, request):
        """Disconnect YouTube account only (keep user logged in)"""
        try:
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            user = request.user
            print(f"Disconnecting YouTube for user: {user.username}")
            
            # Clear YouTube tokens from Django user
            user.youtube_access_token = None
            user.youtube_refresh_token = None
            user.token_expiry = None
            user.is_active_channel = None
            user.save()
            
            # Clear YouTube tokens from MongoDB user
            try:
                mongo_user_data = {
                    'youtube_access_token': None,
                    'youtube_refresh_token': None,
                    'token_expiry': None,
                    'updated_at': timezone.now()
                }
                MongoService.create_or_update_user(user.id, mongo_user_data)
                print(f"✅ Cleared MongoDB user YouTube tokens for: {user.username}")
            except Exception as mongo_error:
                print(f"⚠️  Warning: MongoDB YouTube disconnect cleanup failed: {str(mongo_error)}")
            
            # Also disconnect all channels
            try:
                channels = Channel.objects.filter(user=user)
                for channel in channels:
                    channel.is_connected = False
                    channel.save()
                print(f"✅ Disconnected {channels.count()} channels for user: {user.username}")
            except Exception as channel_error:
                print(f"⚠️  Warning: Channel disconnect cleanup failed: {str(channel_error)}")
            
            return Response({
                'message': 'Successfully disconnected YouTube account',
                'channels_disconnected': channels.count() if 'channels' in locals() else 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'YouTube disconnect failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChannelView(APIView):
    """Channel management views"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's connected channels"""
        try:
            channels = Channel.objects.filter(user=request.user, is_connected=True)
            serializer = ChannelSerializer(channels, many=True)
            return Response({
                'channels': serializer.data,
                'count': len(serializer.data)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch channels: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Connect new YouTube channel"""
        try:
            serializer = ChannelConnectionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user's YouTube channels
            youtube_service = get_youtube_service()
            channels_data = youtube_service.get_user_channels(
                request.user.youtube_access_token
            )
            
            if not channels_data:
                return Response(
                    {'error': 'No YouTube channels found for this account'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Store channels
            created_channels = []
            for channel_data in channels_data:
                channel, created = Channel.objects.get_or_create(
                    id=channel_data['id'],
                    user=request.user,
                    defaults={
                        'title': channel_data['title'],
                        'description': channel_data['description'],
                        'custom_url': channel_data['custom_url'],
                        'thumbnail_url': channel_data['thumbnail_url'],
                        'subscriber_count': channel_data['subscriber_count'],
                        'video_count': channel_data['video_count'],
                        'view_count': channel_data['view_count'],
                        'country': channel_data['country'],
                        'published_at': channel_data['published_at']
                    }
                )
                
                if created:
                    created_channels.append(channel)
                    
                    # Also store channel in MongoDB
                    try:
                        # Parse the published_at date properly
                        published_at_str = channel_data.get('published_at')
                        published_at = None
                        if published_at_str:
                            try:
                                # Parse ISO 8601 date string from YouTube
                                from datetime import datetime
                                published_at = datetime.fromisoformat(published_at_str.replace('Z', '+00:00'))
                            except ValueError:
                                # Fallback: use current time if parsing fails
                                published_at = timezone.now()
                                print(f"⚠️  Could not parse published_at date: {published_at_str}, using current time")
                        
                        mongo_channel_data = {
                            'youtube_id': channel_data['id'],
                            'django_user_id': request.user.id,
                            'title': channel_data['title'],
                            'description': channel_data.get('description', ''),
                            'custom_url': channel_data.get('custom_url', ''),
                            'thumbnail_url': channel_data.get('thumbnail_url', ''),
                            'subscriber_count': int(channel_data.get('subscriber_count', 0)),
                            'video_count': int(channel_data.get('video_count', 0)),
                            'view_count': int(channel_data.get('view_count', 0)),
                            'country': channel_data.get('country', ''),
                            'published_at': published_at,
                            'is_connected': True,
                            'last_sync': timezone.now(),
                            'created_at': timezone.now()
                        }
                        
                        MongoService.create_or_update_channel(mongo_channel_data)
                        print(f"✅ Stored channel in MongoDB: {channel_data['title']}")
                        
                    except Exception as mongo_error:
                        print(f"⚠️  Warning: MongoDB channel storage failed: {str(mongo_error)}")
                        # Continue without MongoDB storage - not critical
                else:
                    # Update existing channel
                    for key, value in channel_data.items():
                        if hasattr(channel, key):
                            setattr(channel, key, value)
                    channel.save()
                    
                    # Also update MongoDB channel
                    try:
                        # Parse the published_at date properly
                        published_at_str = channel_data.get('published_at')
                        published_at = None
                        if published_at_str:
                            try:
                                # Parse ISO 8601 date string from YouTube
                                from datetime import datetime
                                published_at = datetime.fromisoformat(published_at_str.replace('Z', '+00:00'))
                            except ValueError:
                                # Fallback: use current time if parsing fails
                                published_at = timezone.now()
                                print(f"⚠️  Could not parse published_at date: {published_at_str}, using current time")
                        
                        mongo_channel_data = {
                            'youtube_id': channel_data['id'],
                            'django_user_id': request.user.id,
                            'title': channel_data['title'],
                            'description': channel_data.get('description', ''),
                            'custom_url': channel_data.get('custom_url', ''),
                            'thumbnail_url': channel_data.get('thumbnail_url', ''),
                            'subscriber_count': int(channel_data.get('subscriber_count', 0)),
                            'video_count': int(channel_data.get('video_count', 0)),
                            'view_count': int(channel_data.get('view_count', 0)),
                            'country': channel_data.get('country', ''),
                            'published_at': published_at,
                            'is_connected': True,
                            'last_sync': timezone.now(),
                            'updated_at': timezone.now()
                        }
                        
                        MongoService.create_or_update_channel(mongo_channel_data)
                        print(f"✅ Updated channel in MongoDB: {channel_data['title']}")
                        
                    except Exception as mongo_error:
                        print(f"⚠️  Warning: MongoDB channel update failed: {str(mongo_error)}")
                        # Continue without MongoDB update - not critical
            
            # Set first channel as active if none is set
            if not request.user.is_active_channel and created_channels:
                request.user.is_active_channel = created_channels[0].id
                request.user.save()
            
            return Response({
                'message': f'Successfully connected {len(created_channels)} channels',
                'channels': ChannelSerializer(created_channels, many=True).data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to connect channels: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChannelDetailView(APIView):
    """Individual channel operations"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, channel_id):
        """Get specific channel details"""
        try:
            channel = Channel.objects.get(id=channel_id, user=request.user)
            serializer = ChannelDetailSerializer(channel)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Channel.DoesNotExist:
            return Response(
                {'error': 'Channel not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch channel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, channel_id):
        """Switch active channel"""
        try:
            channel = Channel.objects.get(id=channel_id, user=request.user)
            request.user.is_active_channel = channel.id
            request.user.save()
            
            return Response({
                'message': f'Switched to channel: {channel.title}',
                'active_channel': ChannelSerializer(channel).data
            }, status=status.HTTP_200_OK)
            
        except Channel.DoesNotExist:
            return Response(
                {'error': 'Channel not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to switch channel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoView(APIView):
    """Video management views"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get videos from active channel"""
        try:
            if not request.user.is_active_channel:
                return Response(
                    {'error': 'No active channel selected'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            offset = (page - 1) * per_page
            
            # Get videos from active channel
            videos = Video.objects.filter(
                channel_id=request.user.is_active_channel
            ).order_by('-published_at')[offset:offset + per_page]
            
            serializer = VideoSerializer(videos, many=True)
            
            # Get total count for pagination
            total_videos = Video.objects.filter(
                channel_id=request.user.is_active_channel
            ).count()
            
            return Response({
                'videos': serializer.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_videos,
                    'has_next': (page * per_page) < total_videos,
                    'has_prev': page > 1
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch videos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Fetch videos from YouTube channel"""
        try:
            print(f"Video fetch request from user: {request.user.username}")  # Debug log
            
            # Check if user has YouTube connected
            if not request.user.youtube_access_token:
                return Response(
                    {'error': 'YouTube not connected. Please connect your YouTube account first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user's connected channels
            user_channels = Channel.objects.filter(user=request.user, is_connected=True)
            if not user_channels.exists():
                return Response(
                    {'error': 'No connected channels found. Please connect your YouTube account first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use first connected channel if no active channel is set
            active_channel_id = request.user.is_active_channel
            if not active_channel_id:
                active_channel_id = user_channels.first().id
                request.user.is_active_channel = active_channel_id
                request.user.save()
                print(f"Set active channel for user {request.user.username}: {active_channel_id}")  # Debug log
            
            print(f"Fetching videos for channel: {active_channel_id}")  # Debug log
            
            # Get videos from YouTube using the user's credentials
            try:
                from googleapiclient.discovery import build
                from google.oauth2.credentials import Credentials
                
                client_id = os.getenv('GOOGLE_CLIENT_ID')
                client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
                
                if not client_id or not client_secret:
                    return Response({
                        'error': 'Google OAuth configuration missing. Please check backend configuration.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Create credentials with user's tokens
                credentials = Credentials(
                    request.user.youtube_access_token,
                    refresh_token=request.user.youtube_refresh_token,
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=client_id,
                    client_secret=client_secret,
                    scopes=['https://www.googleapis.com/auth/youtube.force-ssl']
                )
                
                # Build YouTube API service
                youtube = build('youtube', 'v3', credentials=credentials)
                
                # Get channel's uploads playlist
                channels_response = youtube.channels().list(
                    part='contentDetails',
                    id=active_channel_id
                ).execute()
                
                if not channels_response.get('items'):
                    return Response(
                        {'error': 'Channel not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                uploads_playlist_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
                print(f"Found uploads playlist: {uploads_playlist_id}")  # Debug log
                
                # Get videos from uploads playlist
                videos_response = youtube.playlistItems().list(
                    part='snippet,contentDetails',
                    playlistId=uploads_playlist_id,
                    maxResults=50  # Get last 50 videos
                ).execute()
                
                videos_data = []
                for item in videos_response.get('items', []):
                    video_id = item['contentDetails']['videoId']
                    
                    # Get detailed video information
                    video_details_response = youtube.videos().list(
                        part='snippet,contentDetails,statistics',
                        id=video_id
                    ).execute()
                    
                    if video_details_response.get('items'):
                        video_detail = video_details_response['items'][0]
                        snippet = video_detail['snippet']
                        content_details = video_detail['contentDetails']
                        statistics = video_detail['statistics']
                        
                        video_data = {
                            'id': video_id,
                            'title': snippet['title'],
                            'description': snippet.get('description', ''),
                            'thumbnail_url': snippet.get('thumbnails', {}).get('medium', {}).get('url', ''),
                            'published_at': snippet.get('publishedAt'),
                            'duration': content_details.get('duration', ''),
                            'view_count': int(statistics.get('viewCount', 0)),
                            'like_count': int(statistics.get('likeCount', 0)),
                            'comment_count': int(statistics.get('commentCount', 0)),
                            'category_id': snippet.get('categoryId', ''),
                            'tags': snippet.get('tags', []),
                            'language': snippet.get('defaultLanguage', ''),
                            'channel_id': snippet['channelId'],
                            'channel_title': snippet['channelTitle']
                        }
                        videos_data.append(video_data)
                
                print(f"Retrieved {len(videos_data)} videos from YouTube API")  # Debug log
                
            except Exception as youtube_api_error:
                print(f"YouTube API error: {str(youtube_api_error)}")  # Debug log
                return Response({
                    'error': f'Failed to fetch videos from YouTube: {str(youtube_api_error)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if not videos_data:
                return Response(
                    {'error': 'No videos found for this channel'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Store videos in database
            created_videos = []
            updated_videos = []
            
            for video_data in videos_data:
                try:
                    # Parse the published date
                    published_at = None
                    if video_data.get('published_at'):
                        try:
                            published_at = datetime.fromisoformat(
                                video_data['published_at'].replace('Z', '+00:00')
                            )
                        except:
                            published_at = timezone.now()
                    else:
                        published_at = timezone.now()
                    
                    video, created = Video.objects.get_or_create(
                        id=video_data['id'],
                        defaults={
                            'channel_id': active_channel_id,
                            'title': video_data['title'],
                            'description': video_data['description'],
                            'thumbnail_url': video_data['thumbnail_url'],
                            'published_at': published_at,
                            'duration': video_data['duration'],
                            'view_count': video_data['view_count'],
                            'like_count': video_data['like_count'],
                            'comment_count': video_data['comment_count'],
                            'category_id': video_data['category_id'],
                            'tags': video_data['tags'],
                            'language': video_data['language']
                        }
                    )
                    
                    if created:
                        created_videos.append(video)
                        print(f"Created new video: {video.title}")  # Debug log
                        
                        # Also store video in MongoDB
                        try:
                            mongo_video_data = {
                                'youtube_id': video_data['id'],
                                'django_user_id': request.user.id,
                                'channel_youtube_id': active_channel_id,
                                'title': video_data['title'],
                                'description': video_data['description'],
                                'thumbnail_url': video_data['thumbnail_url'],
                                'published_at': published_at,
                                'duration': video_data['duration'],
                                'view_count': video_data['view_count'],
                                'like_count': video_data['like_count'],
                                'comment_count': video_data['comment_count'],
                                'category_id': video_data['category_id'],
                                'tags': video_data['tags'],
                                'language': video_data['language'],
                                'created_at': timezone.now(),
                                'updated_at': timezone.now()
                            }
                            
                            MongoService.create_or_update_video(mongo_video_data)
                            print(f"✅ Stored video in MongoDB: {video_data['title']}")
                            
                        except Exception as mongo_error:
                            print(f"⚠️  Warning: MongoDB video storage failed: {str(mongo_error)}")
                            # Continue without MongoDB storage - not critical
                    else:
                        # Update existing video
                        video.title = video_data['title']
                        video.description = video_data['description']
                        video.thumbnail_url = video_data['thumbnail_url']
                        video.view_count = video_data['view_count']
                        video.like_count = video_data['like_count']
                        video.comment_count = video_data['comment_count']
                        video.save()
                        updated_videos.append(video)
                        print(f"Updated existing video: {video.title}")  # Debug log
                        
                        # Also update MongoDB video
                        try:
                            mongo_video_data = {
                                'youtube_id': video_data['id'],
                                'django_user_id': request.user.id,
                                'channel_youtube_id': active_channel_id,
                                'title': video_data['title'],
                                'description': video_data['description'],
                                'thumbnail_url': video_data['thumbnail_url'],
                                'published_at': published_at,
                                'duration': video_data['duration'],
                                'view_count': video_data['view_count'],
                                'like_count': video_data['like_count'],
                                'comment_count': video_data['comment_count'],
                                'category_id': video_data['category_id'],
                                'tags': video_data['tags'],
                                'language': video_data['language'],
                                'updated_at': timezone.now()
                            }
                            
                            MongoService.create_or_update_video(mongo_video_data)
                            print(f"✅ Updated video in MongoDB: {video_data['title']}")
                            
                        except Exception as mongo_error:
                            print(f"⚠️  Warning: MongoDB video update failed: {str(mongo_error)}")
                            # Continue without MongoDB update - not critical
                        
                except Exception as video_save_error:
                    print(f"Error saving video {video_data.get('id', 'unknown')}: {str(video_save_error)}")  # Debug log
                    continue
            
            print(f"Successfully processed {len(created_videos)} new videos and {len(updated_videos)} updated videos")  # Debug log
            
            # Return the videos data
            all_videos = Video.objects.filter(channel_id=active_channel_id).order_by('-published_at')
            serializer = VideoSerializer(all_videos, many=True)
            
            return Response({
                'message': f'Successfully fetched {len(videos_data)} videos',
                'videos': serializer.data,
                'videos_fetched': len(videos_data),
                'videos_created': len(created_videos),
                'videos_updated': len(updated_videos),
                'total_videos': all_videos.count()
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch videos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoDetailView(APIView):
    """Individual video operations"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_id):
        """Get specific video details"""
        try:
            video = Video.objects.get(id=video_id)
            # Check if user has access to this video's channel
            if video.channel.user != request.user:
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = VideoDetailSerializer(video)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Video.DoesNotExist:
            return Response(
                {'error': 'Video not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch video: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AnalysisView(APIView):
    """Video analysis views"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, video_id):
        """Analyze video comments using AI"""
        try:
            print(f"AI analysis request for video {video_id} from user: {request.user.username}")  # Debug log
            
            # Get video
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != request.user:
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            print(f"Found video: {video.title}")  # Debug log
            
            # Check if comments are already fetched
            if not video.comments_fetched:
                print(f"Comments not fetched for video {video_id}, fetching now...")  # Debug log
                
                # Use comment service to fetch comments
                from .services.comment_service import CommentService
                comment_service = CommentService(request.user)
                
                success, message, comments_data = comment_service.fetch_video_comments(video_id, max_results=100)
                
                if not success:
                    return Response(
                        {'error': f'Failed to fetch comments: {message}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Store comments
                store_success, store_message, stored_count = comment_service.store_comments(video_id, comments_data)
                
                if not store_success:
                    return Response(
                        {'error': f'Failed to store comments: {store_message}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                print(f"Successfully fetched and stored {stored_count} comments")  # Debug log
                video.comments_fetched = True
                video.last_comment_fetch = timezone.now()
                video.save()
            
            # Get comments for analysis
            comments = Comment.objects.filter(video=video)
            if not comments.exists():
                return Response(
                    {'error': 'No comments found for analysis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Found {comments.count()} comments for analysis")  # Debug log
            
            # Check if analysis is needed
            unanalyzed_comments = comments.filter(is_analyzed=False)
            if not unanalyzed_comments.exists():
                print(f"All comments already analyzed for video {video_id}")  # Debug log
                return Response({
                    'message': 'All comments already analyzed',
                    'video_id': video_id,
                    'analysis_available': True,
                    'comments_analyzed': comments.count()
                }, status=status.HTTP_200_OK)
            
            print(f"Analyzing {unanalyzed_comments.count()} unanalyzed comments...")  # Debug log
            
            # Start analysis
            start_time = time.time()
            analysis_results = []
            
            # Import AI service
            from .services.ai_service import ai_service
            
            # Analyze each unanalyzed comment
            for comment in unanalyzed_comments:
                try:
                    print(f"Analyzing comment: {comment.text[:50]}...")  # Debug log
                    
                    # Use comprehensive analysis
                    analysis_result = ai_service.analyze_single_comment_comprehensive(comment.text)
                    
                    # Update comment with analysis results
                    sentiment = analysis_result['sentiment_analysis']
                    toxicity = analysis_result['toxicity_analysis']
                    
                    comment.sentiment_score = sentiment['sentiment_score']
                    comment.sentiment_label = sentiment['sentiment_label']
                    comment.toxicity_score = toxicity['toxicity_score']
                    comment.toxicity_label = toxicity['toxicity_label']
                    comment.is_analyzed = True
                    comment.analysis_date = timezone.now()
                    comment.save()
                    
                    analysis_results.append(analysis_result)
                    print(f"Successfully analyzed comment {comment.id}")  # Debug log
                    
                except Exception as comment_error:
                    print(f"Error analyzing comment {comment.id}: {str(comment_error)}")  # Debug log
                    continue
            
            # Calculate overall metrics
            print(f"Calculating overall metrics for {len(analysis_results)} analyzed comments...")  # Debug log
            
            # Prepare data for metrics calculation
            metrics_data = []
            for result in analysis_results:
                metrics_data.append({
                    'sentiment': {
                        'sentiment_label': result['sentiment_analysis']['sentiment_label'],
                        'sentiment_score': result['sentiment_analysis']['sentiment_score']
                    },
                    'toxicity': {
                        'toxicity_label': result['toxicity_analysis']['toxicity_label'],
                        'toxicity_score': result['toxicity_analysis']['toxicity_score']
                    }
                })
            
            # Calculate engagement metrics
            metrics = ai_service.calculate_engagement_metrics(metrics_data)
            
            # Generate audience insights
            insights = ai_service.generate_audience_insights(metrics_data)
            
            # Create or update analysis result
            analysis_result, created = AnalysisResult.objects.get_or_create(
                video=video,
                defaults={
                    'total_comments': comments.count(),
                    'analyzed_comments': len(analysis_results),
                    'positive_sentiment_ratio': metrics['positive_sentiment_ratio'],
                    'negative_sentiment_ratio': metrics['negative_sentiment_ratio'],
                    'neutral_sentiment_ratio': metrics['neutral_sentiment_ratio'],
                    'average_toxicity_score': metrics['average_toxicity_score'],
                    'engagement_score': metrics['engagement_score'],
                    'audience_insights': insights['audience_insights'],
                    'content_recommendations': insights['content_recommendations'],
                    'engagement_trends': insights['engagement_trends'],
                    'processing_time': time.time() - start_time
                }
            )
            
            if not created:
                # Update existing analysis
                analysis_result.total_comments = comments.count()
                analysis_result.analyzed_comments = len(analysis_results)
                analysis_result.positive_sentiment_ratio = metrics['positive_sentiment_ratio']
                analysis_result.negative_sentiment_ratio = metrics['negative_sentiment_ratio']
                analysis_result.neutral_sentiment_ratio = metrics['neutral_sentiment_ratio']
                analysis_result.average_toxicity_score = metrics['average_toxicity_score']
                analysis_result.engagement_score = metrics['engagement_score']
                analysis_result.audience_insights = insights['audience_insights']
                analysis_result.content_recommendations = insights['content_recommendations']
                analysis_result.engagement_trends = insights['engagement_trends']
                analysis_result.processing_time = time.time() - start_time
                analysis_result.save()
            
            # Update video analysis status
            video.comments_analyzed = True
            video.last_analysis = timezone.now()
            video.save()
            
            processing_time = time.time() - start_time
            print(f"Analysis completed in {processing_time:.2f} seconds")  # Debug log
            
            return Response({
                'message': f'Successfully analyzed {len(analysis_results)} comments',
                'video_id': video_id,
                'analysis_available': True,
                'comments_analyzed': len(analysis_results),
                'total_comments': comments.count(),
                'processing_time': round(processing_time, 2),
                'metrics': metrics,
                'insights': insights
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in AnalysisView.post: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full stack trace
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request, video_id):
        """Get analysis results for a video"""
        try:
            # Get video
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != request.user:
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get analysis result
            try:
                analysis_result = AnalysisResult.objects.get(video=video)
                serializer = AnalysisResultSerializer(analysis_result)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except AnalysisResult.DoesNotExist:
                return Response({
                    'error': 'Analysis not available for this video',
                    'video_id': video_id,
                    'comments_fetched': video.comments_fetched,
                    'comments_analyzed': video.comments_analyzed
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch analysis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CommentView(APIView):
    """Comment management views"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_id):
        """Get comments for a video"""
        try:
            # Get video
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != request.user:
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get pagination parameters
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 50))
            offset = (page - 1) * per_page
            
            # Get comments
            comments = Comment.objects.filter(video=video).order_by('-published_at')[offset:offset + per_page]
            serializer = CommentSerializer(comments, many=True)
            
            # Get total count for pagination
            total_comments = Comment.objects.filter(video=video).count()
            
            return Response({
                'comments': serializer.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_comments,
                    'has_next': (page * per_page) < total_comments,
                    'has_prev': page > 1
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch comments: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, video_id):
        """Fetch comments for a video from YouTube"""
        try:
            print(f"Comment fetch request for video {video_id} from user: {request.user.username}")  # Debug log
            
            # Get max results parameter
            max_results = int(request.data.get('max_results', 100))
            print(f"Max results requested: {max_results}")  # Debug log
            
            # Use comment service to fetch and store comments
            from .services.comment_service import CommentService
            comment_service = CommentService(request.user)
            
            # Step 1: Fetch comments from YouTube
            print(f"Step 1: Fetching comments from YouTube API...")  # Debug log
            success, message, comments_data = comment_service.fetch_video_comments(
                video_id, max_results
            )
            
            if not success:
                print(f"YouTube API fetch failed: {message}")  # Debug log
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Step 1 completed: Fetched {len(comments_data)} comments from YouTube")  # Debug log
            
            # Step 2: Store comments in database
            print(f"Step 2: Storing comments in database...")  # Debug log
            store_success, store_message, stored_count = comment_service.store_comments(
                video_id, comments_data
            )
            
            if not store_success:
                print(f"Database storage failed: {store_message}")  # Debug log
                return Response(
                    {'error': f'Fetched comments but failed to store: {store_message}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            print(f"Step 2 completed: Stored {stored_count} comments in database")  # Debug log
            
            return Response({
                'message': f'Successfully fetched and stored {stored_count} comments',
                'comments_fetched': len(comments_data),
                'comments_stored': stored_count,
                'video_id': video_id,
                'details': {
                    'youtube_fetch_success': success,
                    'youtube_fetch_message': message,
                    'database_storage_success': store_success,
                    'database_storage_message': store_message
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in CommentView.post: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full stack trace
            return Response(
                {'error': f'Failed to fetch comments: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request, video_id):
        """Trigger AI analysis for existing comments"""
        try:
            print(f"AI analysis request for video {video_id} from user: {request.user.username}")  # Debug log
            
            # Get video and check access
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != request.user:
                    return Response(
                        {'error': 'Access denied to this video'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get unanalyzed comments
            unanalyzed_comments = Comment.objects.filter(
                video=video,
                is_analyzed=False
            )
            
            if not unanalyzed_comments.exists():
                return Response({
                    'message': 'All comments are already analyzed',
                    'comments_analyzed': 0,
                    'video_id': video_id
                }, status=status.HTTP_200_OK)
            
            print(f"Found {unanalyzed_comments.count()} unanalyzed comments")  # Debug log
            
            # Perform AI analysis
            from .services.ai_service import AIService
            ai_service = AIService()
            
            analyzed_count = 0
            failed_count = 0
            
            for comment in unanalyzed_comments:
                try:
                    print(f"Analyzing comment {comment.id}...")  # Debug log
                    
                    # Analyze comment
                    analysis_result = ai_service.analyze_comment_realtime(
                        comment.text,
                        str(comment.id)
                    )
                    
                    if analysis_result.get('status') == 'completed':
                        # Store analysis results directly in the comment model
                        comment.sentiment_score = analysis_result.get('sentiment_score', 0.0)
                        comment.sentiment_label = analysis_result.get('sentiment_label', 'neutral')
                        comment.toxicity_score = analysis_result.get('toxicity_score', 0.0)
                        comment.toxicity_label = analysis_result.get('toxicity_label', 'not_toxic')
                        comment.is_analyzed = True
                        comment.analysis_date = timezone.now()
                        comment.save()
                        
                        analyzed_count += 1
                        print(f"AI analysis completed for comment {comment.id}")  # Debug log
                    else:
                        failed_count += 1
                        print(f"AI analysis failed for comment {comment.id}: {analysis_result.get('error', 'Unknown error')}")  # Debug log
                        
                except Exception as analysis_error:
                    failed_count += 1
                    print(f"Error during AI analysis for comment {comment.id}: {str(analysis_error)}")  # Debug log
            
            print(f"AI analysis completed: {analyzed_count} successful, {failed_count} failed")  # Debug log
            
            return Response({
                'message': f'AI analysis completed for {analyzed_count} comments',
                'comments_analyzed': analyzed_count,
                'comments_failed': failed_count,
                'video_id': video_id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in CommentView.put: {str(e)}")  # Debug log
            import traceback
            traceback.print_exc()  # Print full stack trace
            return Response(
                {'error': f'Failed to perform AI analysis: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(APIView):
    """User profile and preferences"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user profile"""
        try:
            serializer = UserSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Update user preferences"""
        try:
            preferences, created = UserPreference.objects.get_or_create(user=request.user)
            serializer = UserPreferenceSerializer(preferences, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to update preferences: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ServiceStatusView(APIView):
    """Service status and health check"""
    
    def get(self, request):
        """Get status of all services"""
        try:
            youtube_service = get_youtube_service()
            youtube_status = youtube_service.test_connection()
            ai_status = ai_service.get_service_status()
            
            return Response({
                'youtube_api': {
                    'status': 'connected' if youtube_status else 'disconnected',
                    'available': youtube_status
                },
                'ai_service': ai_status,
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get service status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoInsightsView(APIView):
    """Video-level insights and analytics dashboard data"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_id):
        """Get comprehensive video insights and analytics"""
        try:
            # Get video and check access
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != request.user:
                    return Response(
                        {'error': 'Access denied to this video'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Video.DoesNotExist:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all analyzed comments for this video
            comments = Comment.objects.filter(video=video, is_analyzed=True)
            
            if not comments.exists():
                return Response({
                    'error': 'No analyzed comments found for this video',
                    'video_id': video_id,
                    'comments_fetched': video.comments_fetched,
                    'comments_analyzed': video.comments_analyzed,
                    'message': 'Please analyze video comments first to generate insights'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Prepare comment data for aggregation
            comments_data = []
            for comment in comments:
                comments_data.append({
                    'id': comment.id,
                    'text': comment.text,
                    'sentiment_score': comment.sentiment_score,
                    'sentiment_label': comment.sentiment_label,
                    'toxicity_score': comment.toxicity_score,
                    'toxicity_label': comment.toxicity_label,
                    'is_analyzed': comment.is_analyzed,
                    'analysis_date': comment.analysis_date,
                    'author_name': comment.author_name,
                    'like_count': comment.like_count,
                    'published_at': comment.published_at
                })
            
            # Generate aggregated insights using AI service
            try:
                aggregated_insights = ai_service.aggregate_video_insights(comments_data)
                
                # Add video metadata
                response_data = {
                    'video': {
                        'id': video.id,
                        'title': video.title,
                        'thumbnail_url': video.thumbnail_url,
                        'published_at': video.published_at,
                        'view_count': video.view_count,
                        'like_count': video.like_count,
                        'comment_count': video.comment_count
                    },
                    'channel': {
                        'id': video.channel.id,
                        'title': video.channel.title,
                        'thumbnail_url': video.channel.thumbnail_url
                    },
                    'insights': aggregated_insights,
                    'analysis_summary': {
                        'total_comments': len(comments_data),
                        'analysis_coverage': aggregated_insights.get('analysis_coverage', 0),
                        'overall_sentiment': 'positive' if aggregated_insights.get('sentiment_metrics', {}).get('positive_ratio', 0) > 0.5 else 'negative' if aggregated_insights.get('sentiment_metrics', {}).get('negative_ratio', 0) > 0.5 else 'neutral',
                        'engagement_level': 'high' if aggregated_insights.get('engagement_metrics', {}).get('overall_score', 0) > 0.7 else 'medium' if aggregated_insights.get('engagement_metrics', {}).get('overall_score', 0) > 0.4 else 'low'
                    }
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
            except Exception as ai_error:
                print(f"AI insight generation failed: {str(ai_error)}")
                return Response({
                    'error': f'Failed to generate insights: {str(ai_error)}',
                    'video_id': video_id,
                    'comments_available': len(comments_data)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch video insights: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class URLAnalysisView(APIView):
    """URL-based video analysis for any YouTube video (no auth required)"""
    
    def post(self, request):
        """Analyze any YouTube video by URL"""
        try:
            url = request.data.get('url')
            max_comments = request.data.get('max_comments', 100)
            
            if not url:
                return Response(
                    {'error': 'YouTube URL is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate max_comments
            try:
                max_comments = int(max_comments)
                if max_comments < 1 or max_comments > 1000:
                    max_comments = 100
            except (ValueError, TypeError):
                max_comments = 100
            
            print(f"URL analysis request for URL: {url}")
            
            # Use YouTube Data API based service instead of yt-dlp scraping
            yt_service = YouTubeAPIService()
            success, message, analysis_data = yt_service.analyze_video_by_url(url, max_comments)

            if not success or not analysis_data:
                # Map structured error messages to HTTP status codes
                error_msg = message or "Analysis failed"
                if error_msg.startswith("QUOTA_EXCEEDED:"):
                    http_status = status.HTTP_429_TOO_MANY_REQUESTS
                elif error_msg.startswith("INVALID_VIDEO:"):
                    http_status = status.HTTP_400_BAD_REQUEST
                elif error_msg.startswith("CONFIG_ERROR:"):
                    http_status = status.HTTP_500_INTERNAL_SERVER_ERROR
                else:
                    http_status = status.HTTP_400_BAD_REQUEST

                return Response({'error': error_msg}, status=http_status)
            
            # Perform AI analysis on comments
            try:
                comments_for_analysis = []
                for comment in analysis_data['comments']:
                    # Handle published_at safely (can be ISO8601 string from YouTube Data API)
                    published_at_str = None
                    if comment.get('published_at'):
                        published_at = comment['published_at']
                        if isinstance(published_at, str):
                            published_at_str = published_at
                        elif hasattr(published_at, 'isoformat'):
                            published_at_str = published_at.isoformat()
                        elif isinstance(published_at, (int, float)):
                            published_at_str = datetime.fromtimestamp(published_at).isoformat()
                        else:
                            published_at_str = str(published_at)
                    
                    comments_for_analysis.append({
                        'text': comment['text'],
                        'author_name': comment['author_name'],
                        'like_count': comment['like_count'],
                        'published_at': published_at_str
                    })
                
                # Generate AI insights using the new URL analysis method
                ai_insights = ai_service.analyze_url_comments(
                    comments_for_analysis, 
                    video_title=analysis_data['video_details']['title'],
                    video_description=analysis_data['video_details']['description']
                )
                
                # Prepare response data
                response_data = {
                    'success': True,
                    'message': message,
                    'video': {
                        'id': analysis_data['video_id'],
                        'title': analysis_data['video_details']['title'],
                        'description': analysis_data['video_details']['description'],
                        'thumbnail_url': analysis_data['video_details']['thumbnail_url'],
                        'published_at': analysis_data['video_details']['published_at'].isoformat() if analysis_data['video_details'].get('published_at') and hasattr(analysis_data['video_details']['published_at'], 'isoformat') else None,
                        'view_count': analysis_data['video_details']['view_count'],
                        'like_count': analysis_data['video_details']['like_count'],
                        'comment_count': analysis_data['video_details']['comment_count'],
                        'channel_title': analysis_data['video_details']['channel_title'],
                        'duration': analysis_data['video_details']['duration']
                    },
                    'analysis': {
                        'total_comments_analyzed': analysis_data['total_comments_fetched'],
                        'analysis_timestamp': analysis_data['analysis_timestamp'],
                        'ai_insights': ai_insights
                    },
                    'comments_sample': comments_for_analysis[:10]  # Return first 10 comments as sample
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
            except Exception as ai_error:
                print(f"AI analysis failed: {str(ai_error)}")
                # Return basic analysis without AI insights
                response_data = {
                    'success': True,
                    'message': f"{message} (AI analysis failed: {str(ai_error)})",
                    'video': {
                        'id': analysis_data['video_id'],
                        'title': analysis_data['video_details']['title'],
                        'description': analysis_data['video_details']['description'],
                        'thumbnail_url': analysis_data['video_details']['thumbnail_url'],
                        'published_at': analysis_data['video_details']['published_at'].isoformat() if analysis_data['video_details'].get('published_at') and hasattr(analysis_data['video_details']['published_at'], 'isoformat') else None,
                        'view_count': analysis_data['video_details']['view_count'],
                        'like_count': analysis_data['video_details']['like_count'],
                        'comment_count': analysis_data['video_details']['comment_count'],
                        'channel_title': analysis_data['video_details']['channel_title'],
                        'duration': analysis_data['video_details']['duration']
                    },
                    'analysis': {
                        'total_comments_analyzed': analysis_data['total_comments_fetched'],
                        'analysis_timestamp': analysis_data['analysis_timestamp'],
                        'ai_insights': None,
                        'ai_error': str(ai_error)
                    },
                    'comments_sample': [{'text': comment['text'], 'author_name': comment['author_name']} for comment in analysis_data['comments'][:10]]
                }
                
                return Response(response_data, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"URL analysis error: {str(e)}")
            return Response(
                {'error': f'Analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
