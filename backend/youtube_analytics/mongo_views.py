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
from django.utils import timezone

# Import Django models for authentication only
from .models import User, UserPreference

# Import MongoDB service and models
from .services.mongo_service import MongoService
from .mongo_models import MongoUser, MongoChannel, MongoVideo, MongoComment, MongoAnalysisResult

# Import other services
from .services.youtube_service import get_youtube_service
from .services.ai_service import ai_service


class MongoAuthView(APIView):
    """Enhanced authentication views with MongoDB integration"""
    
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
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
    
    def google_oauth(self, request):
        """Handle Google OAuth login with MongoDB integration"""
        try:
            data = json.loads(request.body)
            id_token = data.get('id_token')
            
            if not id_token:
                return Response(
                    {'error': 'Missing Google ID token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"Processing Google OAuth for token: {id_token[:20]}...")
            
            # Decode the JWT token
            try:
                import jwt
                decoded = jwt.decode(id_token, options={"verify_signature": False})
                
                google_id = decoded.get('sub')
                google_email = decoded.get('email')
                profile_picture = decoded.get('picture')
                name = decoded.get('name', '')
                
                print(f"Decoded token - ID: {google_id}, Email: {google_email}")
                
                if not all([google_id, google_email]):
                    return Response(
                        {'error': 'Invalid Google token data'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                print(f"Token decode error: {str(e)}")
                return Response(
                    {'error': f'Failed to decode Google token: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to get existing Django user
            try:
                user = User.objects.get(google_id=google_id)
                print(f"Found existing Django user: {user.username}")
            except User.DoesNotExist:
                try:
                    user = User.objects.get(google_email=google_email)
                    print(f"Found user by email: {user.username}")
                    user.google_id = google_id
                except User.DoesNotExist:
                    print(f"Creating new Django user for: {google_email}")
                    # Create new Django user
                    username = google_email.split('@')[0]
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
                        print(f"Created new Django user: {user.username}")
                        
                        # Create default preferences
                        try:
                            UserPreference.objects.create(user=user)
                            print(f"Created Django preferences for user: {user.username}")
                        except Exception as pref_error:
                            print(f"Warning: Could not create Django preferences: {str(pref_error)}")
                        
                    except Exception as create_error:
                        print(f"Django user creation error: {str(create_error)}")
                        return Response(
                            {'error': f'Failed to create user: {str(create_error)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            
            # Update Django user data
            try:
                user.profile_picture = profile_picture
                user.save()
                print(f"Updated Django user profile: {user.username}")
            except Exception as save_error:
                print(f"Warning: Could not update Django profile: {str(save_error)}")
            
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
                print(f"Created/Updated MongoDB user for: {user.username}")
                
            except Exception as mongo_error:
                print(f"Warning: MongoDB user creation failed: {str(mongo_error)}")
                # Continue without MongoDB user - not critical for authentication
            
            # Generate JWT tokens
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                print(f"Generated JWT token for user: {user.username}")
            except Exception as token_error:
                print(f"Token generation error: {str(token_error)}")
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
            
            print(f"Authentication successful for user: {user.username}")
            
            return Response({
                'token': access_token,
                'user': user_data,
                'message': 'Successfully authenticated with MongoDB integration'
            }, status=status.HTTP_200_OK)
            
        except json.JSONDecodeError as json_error:
            print(f"JSON decode error: {str(json_error)}")
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"Unexpected authentication error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Authentication failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def youtube_oauth(self, request):
        """Handle YouTube OAuth with MongoDB integration"""
        try:
            data = json.loads(request.body)
            authorization_code = data.get('authorization_code')
            user_id = data.get('user_id')
            
            if not all([authorization_code, user_id]):
                return Response(
                    {'error': 'Missing authorization code or user ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get Django user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get YouTube service and exchange code for tokens
            youtube_service = get_youtube_service()
            try:
                tokens = youtube_service.exchange_code_for_tokens(authorization_code)
                access_token = tokens.get('access_token')
                refresh_token = tokens.get('refresh_token')
                expires_in = tokens.get('expires_in')
                
                if not access_token:
                    return Response(
                        {'error': 'Failed to get access token from YouTube'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update Django user with YouTube tokens
                user.youtube_access_token = access_token
                user.youtube_refresh_token = refresh_token
                user.token_expiry = timezone.now() + timedelta(seconds=expires_in)
                user.save()
                
                # Update MongoDB user with YouTube tokens
                try:
                    mongo_user_data = {
                        'youtube_access_token': access_token,
                        'youtube_refresh_token': refresh_token,
                        'token_expiry': user.token_expiry,
                        'updated_at': timezone.now()
                    }
                    MongoService.create_or_update_user(user.id, mongo_user_data)
                    print(f"Updated MongoDB user with YouTube tokens for: {user.username}")
                except Exception as mongo_error:
                    print(f"Warning: MongoDB YouTube token update failed: {str(mongo_error)}")
                
                return Response({
                    'message': 'YouTube OAuth successful',
                    'access_token': access_token,
                    'expires_in': expires_in
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"YouTube OAuth error: {str(e)}")
                return Response(
                    {'error': f'YouTube OAuth failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"YouTube OAuth unexpected error: {str(e)}")
            return Response(
                {'error': f'YouTube OAuth failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def fetch_videos(self, request):
        """Fetch videos from YouTube with MongoDB storage"""
        try:
            data = json.loads(request.body)
            channel_id = data.get('channel_id')
            user_id = data.get('user_id')
            
            if not all([channel_id, user_id]):
                return Response(
                    {'error': 'Missing channel ID or user ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get Django user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get YouTube service and fetch videos
            youtube_service = get_youtube_service()
            try:
                videos = youtube_service.get_channel_videos(channel_id, user.youtube_access_token)
                
                # Store videos in MongoDB
                stored_videos = []
                for video_data in videos:
                    try:
                        mongo_video_data = {
                            'youtube_id': video_data['id'],
                            'channel_youtube_id': channel_id,
                            'django_user_id': user.id,
                            'title': video_data['title'],
                            'description': video_data.get('description', ''),
                            'thumbnail_url': video_data.get('thumbnail', ''),
                            'published_at': video_data.get('published_at'),
                            'duration': video_data.get('duration', ''),
                            'view_count': video_data.get('view_count', 0),
                            'like_count': video_data.get('like_count', 0),
                            'comment_count': video_data.get('comment_count', 0),
                            'category_id': video_data.get('category_id', ''),
                            'tags': video_data.get('tags', []),
                            'language': video_data.get('language', ''),
                            'created_at': timezone.now(),
                            'updated_at': timezone.now()
                        }
                        
                        mongo_video = MongoService.create_or_update_video(mongo_video_data)
                        stored_videos.append(mongo_video)
                        
                    except Exception as video_error:
                        print(f"Error storing video {video_data.get('id')}: {str(video_error)}")
                        continue
                
                return Response({
                    'message': f'Successfully fetched and stored {len(stored_videos)} videos',
                    'videos_count': len(stored_videos),
                    'videos': [{'id': v.youtube_id, 'title': v.title} for v in stored_videos]
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"Video fetching error: {str(e)}")
                return Response(
                    {'error': f'Failed to fetch videos: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"Video fetching unexpected error: {str(e)}")
            return Response(
                {'error': f'Video fetching failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def refresh_token(self, request):
        """Refresh JWT token"""
        try:
            data = json.loads(request.body)
            refresh_token = data.get('refresh_token')
            
            if not refresh_token:
                return Response(
                    {'error': 'Missing refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify and refresh token
            try:
                token = RefreshToken(refresh_token)
                user_id = token.payload.get('user_id')
                
                # Get user
                user = User.objects.get(id=user_id)
                
                # Generate new tokens
                new_refresh = RefreshToken.for_user(user)
                new_access_token = str(new_refresh.access_token)
                
                return Response({
                    'access_token': new_access_token,
                    'refresh_token': str(new_refresh),
                    'message': 'Token refreshed successfully'
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                return Response(
                    {'error': 'Invalid refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except Exception as e:
            return Response(
                {'error': f'Token refresh failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def logout(self, request):
        """Handle user logout"""
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            
            if user_id:
                # Clear YouTube tokens from Django user
                try:
                    user = User.objects.get(id=user_id)
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
                    except Exception as mongo_error:
                        print(f"Warning: MongoDB logout cleanup failed: {str(mongo_error)}")
                        
                except User.DoesNotExist:
                    pass
            
            return Response({
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Logout failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MongoChannelView(APIView):
    """Enhanced channel views with MongoDB integration"""
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's channels from MongoDB"""
        try:
            user_id = request.user.id
            
            # Get channels from MongoDB
            channels = MongoService.get_user_channels(user_id)
            
            # Convert to serializable format
            channel_data = []
            for channel in channels:
                channel_data.append({
                    'id': channel.youtube_id,
                    'title': channel.title,
                    'description': channel.description,
                    'thumbnail_url': channel.thumbnail_url,
                    'subscriber_count': channel.subscriber_count,
                    'video_count': channel.video_count,
                    'view_count': channel.view_count,
                    'country': channel.country,
                    'published_at': channel.published_at.isoformat() if channel.published_at else None,
                    'is_connected': channel.is_connected,
                    'last_sync': channel.last_sync.isoformat() if channel.last_sync else None,
                    'created_at': channel.created_at.isoformat() if channel.created_at else None
                })
            
            return Response({
                'channels': channel_data,
                'count': len(channel_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error getting channels: {str(e)}")
            return Response(
                {'error': f'Failed to get channels: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Connect a new YouTube channel"""
        try:
            data = request.data
            channel_id = data.get('channel_id')
            
            if not channel_id:
                return Response(
                    {'error': 'Missing channel ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_id = request.user.id
            
            # Get YouTube service and fetch channel info
            youtube_service = get_youtube_service()
            try:
                channel_info = youtube_service.get_channel_info(channel_id, request.user.youtube_access_token)
                
                # Store channel in MongoDB
                mongo_channel_data = {
                    'youtube_id': channel_id,
                    'django_user_id': user_id,
                    'title': channel_info['title'],
                    'description': channel_info.get('description', ''),
                    'custom_url': channel_info.get('custom_url', ''),
                    'thumbnail_url': channel_info.get('thumbnail', ''),
                    'subscriber_count': channel_info.get('subscriber_count', 0),
                    'video_count': channel_info.get('video_count', 0),
                    'view_count': channel_info.get('view_count', 0),
                    'country': channel_info.get('country', ''),
                    'published_at': channel_info.get('published_at'),
                    'is_connected': True,
                    'last_sync': timezone.now(),
                    'created_at': timezone.now()
                }
                
                mongo_channel = MongoService.create_or_update_channel(mongo_channel_data)
                
                return Response({
                    'message': 'Channel connected successfully',
                    'channel': {
                        'id': mongo_channel.youtube_id,
                        'title': mongo_channel.title,
                        'thumbnail_url': mongo_channel.thumbnail_url
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                print(f"Channel connection error: {str(e)}")
                return Response(
                    {'error': f'Failed to connect channel: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"Channel connection unexpected error: {str(e)}")
            return Response(
                {'error': f'Channel connection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MongoVideoView(APIView):
    """Enhanced video views with MongoDB integration"""
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's videos from MongoDB"""
        try:
            user_id = request.user.id
            channel_id = request.query_params.get('channel_id')
            
            if channel_id:
                # Get videos for specific channel
                videos = MongoService.get_channel_videos(channel_id, user_id)
            else:
                # Get all user videos
                videos = MongoService.get_user_videos(user_id)
            
            # Convert to serializable format
            video_data = []
            for video in videos:
                video_data.append({
                    'id': video.youtube_id,
                    'title': video.title,
                    'description': video.description,
                    'thumbnail_url': video.thumbnail_url,
                    'published_at': video.published_at.isoformat() if video.published_at else None,
                    'duration': video.duration,
                    'view_count': video.view_count,
                    'like_count': video.like_count,
                    'comment_count': video.comment_count,
                    'category_id': video.category_id,
                    'tags': video.tags,
                    'language': video.language,
                    'comments_fetched': video.comments_fetched,
                    'comments_analyzed': video.comments_analyzed,
                    'last_comment_fetch': video.last_comment_fetch.isoformat() if video.last_comment_fetch else None,
                    'last_analysis': video.last_analysis.isoformat() if video.last_analysis else None,
                    'created_at': video.created_at.isoformat() if video.created_at else None,
                    'updated_at': video.updated_at.isoformat() if video.updated_at else None
                })
            
            return Response({
                'videos': video_data,
                'count': len(video_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error getting videos: {str(e)}")
            return Response(
                {'error': f'Failed to get videos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MongoCommentView(APIView):
    """Enhanced comment views with MongoDB integration"""
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_id):
        """Get comments for a video from MongoDB"""
        try:
            user_id = request.user.id
            
            # Get comments from MongoDB
            comments = MongoService.get_video_comments(video_id, user_id)
            
            # Convert to serializable format
            comment_data = []
            for comment in comments:
                comment_data.append({
                    'id': comment.youtube_id,
                    'author_name': comment.author_name,
                    'author_channel_id': comment.author_channel_id,
                    'author_profile_picture': comment.author_profile_picture,
                    'text': comment.text,
                    'like_count': comment.like_count,
                    'published_at': comment.published_at.isoformat() if comment.published_at else None,
                    'updated_at': comment.updated_at.isoformat() if comment.updated_at else None,
                    'sentiment_score': comment.sentiment_score,
                    'sentiment_label': comment.sentiment_label,
                    'toxicity_score': comment.toxicity_score,
                    'toxicity_label': comment.toxicity_label,
                    'is_analyzed': comment.is_analyzed,
                    'analysis_date': comment.analysis_date.isoformat() if comment.analysis_date else None,
                    'created_at': comment.created_at.isoformat() if comment.created_at else None
                })
            
            return Response({
                'comments': comment_data,
                'count': len(comment_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error getting comments: {str(e)}")
            return Response(
                {'error': f'Failed to get comments: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, video_id):
        """Fetch and analyze comments for a video"""
        try:
            user_id = request.user.id
            
            # Get YouTube service and fetch comments
            youtube_service = get_youtube_service()
            try:
                comments = youtube_service.get_video_comments(video_id, request.user.youtube_access_token)
                
                # Store comments in MongoDB and analyze them
                stored_comments = []
                for comment_data in comments:
                    try:
                        mongo_comment_data = {
                            'youtube_id': comment_data['id'],
                            'video_youtube_id': video_id,
                            'django_user_id': user_id,
                            'author_name': comment_data['author_name'],
                            'author_channel_id': comment_data.get('author_channel_id', ''),
                            'author_profile_picture': comment_data.get('author_profile_picture', ''),
                            'text': comment_data['text'],
                            'like_count': comment_data.get('like_count', 0),
                            'published_at': comment_data.get('published_at'),
                            'created_at': timezone.now()
                        }
                        
                        mongo_comment = MongoService.create_or_update_comment(mongo_comment_data)
                        stored_comments.append(mongo_comment)
                        
                        # Analyze comment with AI
                        try:
                            analysis_result = ai_service.analyze_comment(comment_data['text'])
                            
                            # Update comment with analysis results
                            analysis_data = {
                                'sentiment_score': analysis_result.get('sentiment_score', 0.0),
                                'sentiment_label': analysis_result.get('sentiment_label', 'neutral'),
                                'toxicity_score': analysis_result.get('toxicity_score', 0.0),
                                'toxicity_label': analysis_result.get('toxicity_label', 'not_toxic'),
                                'is_analyzed': True,
                                'analysis_date': timezone.now()
                            }
                            
                            MongoService.update_comment_analysis(mongo_comment.youtube_id, analysis_data)
                            
                        except Exception as analysis_error:
                            print(f"Error analyzing comment {comment_data['id']}: {str(analysis_error)}")
                            continue
                        
                    except Exception as comment_error:
                        print(f"Error storing comment {comment_data.get('id')}: {str(comment_error)}")
                        continue
                
                # Update video flags
                try:
                    video = MongoService.get_video_by_id(video_id, user_id)
                    if video:
                        video.comments_fetched = True
                        video.last_comment_fetch = timezone.now()
                        video.save()
                except Exception as video_error:
                    print(f"Error updating video flags: {str(video_error)}")
                
                return Response({
                    'message': f'Successfully fetched and analyzed {len(stored_comments)} comments',
                    'comments_count': len(stored_comments),
                    'video_id': video_id
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                print(f"Comment fetching error: {str(e)}")
                return Response(
                    {'error': f'Failed to fetch comments: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            print(f"Comment fetching unexpected error: {str(e)}")
            return Response(
                {'error': f'Comment fetching failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MongoVideoInsightsView(APIView):
    """Enhanced video insights view with MongoDB integration"""
    
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, video_id):
        """Get aggregated video insights from MongoDB"""
        try:
            user_id = request.user.id
            
            # Get video from MongoDB
            video = MongoService.get_video_by_id(video_id, user_id)
            if not video:
                return Response(
                    {'error': 'Video not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get comments for analysis
            comments = MongoService.get_video_comments(video_id, user_id)
            
            if not comments:
                return Response(
                    {'error': 'No comments found for this video'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get or create analysis result
            analysis = MongoService.get_video_analysis(video_id, user_id)
            
            if not analysis:
                # Generate new analysis
                try:
                    # Aggregate insights from comments
                    total_comments = len(comments)
                    analyzed_comments = len([c for c in comments if c.is_analyzed])
                    
                    if analyzed_comments == 0:
                        return Response(
                            {'error': 'No analyzed comments found. Please analyze comments first.'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Calculate sentiment ratios
                    positive_comments = [c for c in comments if c.sentiment_label == 'positive']
                    negative_comments = [c for c in comments if c.sentiment_label == 'negative']
                    neutral_comments = [c for c in comments if c.sentiment_label == 'neutral']
                    
                    positive_ratio = len(positive_comments) / analyzed_comments
                    negative_ratio = len(negative_comments) / analyzed_comments
                    neutral_ratio = len(neutral_comments) / analyzed_comments
                    
                    # Calculate average toxicity
                    toxicity_scores = [c.toxicity_score for c in comments if c.toxicity_score is not None]
                    avg_toxicity = sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0.0
                    
                    # Generate AI insights
                    comment_texts = [c.text for c in comments[:50]]  # Limit to first 50 comments
                    ai_insights = ai_service.aggregate_video_insights(comment_texts)
                    
                    # Create analysis result
                    analysis_data = {
                        'video_youtube_id': video_id,
                        'django_user_id': user_id,
                        'total_comments': total_comments,
                        'analyzed_comments': analyzed_comments,
                        'positive_sentiment_ratio': positive_ratio,
                        'negative_sentiment_ratio': negative_ratio,
                        'neutral_sentiment_ratio': neutral_ratio,
                        'average_toxicity_score': avg_toxicity,
                        'top_commenters': [],  # TODO: Implement top commenters logic
                        'engagement_score': 0.0,  # TODO: Implement engagement scoring
                        'comment_quality_score': 0.0,  # TODO: Implement quality scoring
                        'audience_insights': ai_insights.get('audience_insights', ''),
                        'content_recommendations': ai_insights.get('content_recommendations', ''),
                        'engagement_trends': ai_insights.get('engagement_trends', ''),
                        'ai_model_used': 'gemini-1.5-pro'
                    }
                    
                    analysis = MongoService.create_or_update_analysis(analysis_data)
                    
                except Exception as analysis_error:
                    print(f"Error generating analysis: {str(analysis_error)}")
                    return Response(
                        {'error': f'Failed to generate analysis: {str(analysis_error)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
            # Get channel info
            channel = MongoService.get_channel_by_id(video.channel_youtube_id, user_id)
            
            # Prepare response
            response_data = {
                'video': {
                    'id': video.youtube_id,
                    'title': video.title,
                    'description': video.description,
                    'thumbnail_url': video.thumbnail_url,
                    'published_at': video.published_at.isoformat() if video.published_at else None,
                    'view_count': video.view_count,
                    'like_count': video.like_count,
                    'comment_count': video.comment_count
                },
                'channel': {
                    'id': channel.youtube_id if channel else None,
                    'title': channel.title if channel else 'Unknown Channel',
                    'thumbnail_url': channel.thumbnail_url if channel else None
                } if channel else None,
                'insights': {
                    'total_comments': analysis.total_comments,
                    'analyzed_comments': analysis.analyzed_comments,
                    'sentiment_breakdown': {
                        'positive': round(analysis.positive_sentiment_ratio * 100, 1),
                        'negative': round(analysis.negative_sentiment_ratio * 100, 1),
                        'neutral': round(analysis.neutral_sentiment_ratio * 100, 1)
                    },
                    'toxicity_score': round(analysis.average_toxicity_score * 100, 1),
                    'engagement_score': round(analysis.engagement_score * 100, 1),
                    'comment_quality_score': round(analysis.comment_quality_score * 100, 1),
                    'audience_insights': analysis.audience_insights,
                    'content_recommendations': analysis.content_recommendations,
                    'engagement_trends': analysis.engagement_trends,
                    'analysis_date': analysis.analysis_date.isoformat() if analysis.analysis_date else None
                },
                'summary': {
                    'overall_sentiment': 'positive' if analysis.positive_sentiment_ratio > 0.5 else 'negative' if analysis.negative_sentiment_ratio > 0.5 else 'neutral',
                    'engagement_level': 'high' if analysis.engagement_score > 0.7 else 'medium' if analysis.engagement_score > 0.4 else 'low',
                    'comment_quality': 'high' if analysis.comment_quality_score > 0.7 else 'medium' if analysis.comment_quality_score > 0.4 else 'low'
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error getting video insights: {str(e)}")
            return Response(
                {'error': f'Failed to get video insights: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MongoDashboardStatsView(APIView):
    """Get dashboard statistics for a user"""
    
    def get(self, request, user_id):
        """Get user's dashboard stats"""
        try:
            print(f"🔍 Dashboard stats request for user ID: {user_id}")
            
            # Get user's stats from MongoDB
            stats = MongoService.get_user_dashboard_stats(user_id)
            print(f"📊 MongoDB stats result: {stats}")
            
            if not stats:
                print(f"⚠️  No stats found for user {user_id}, returning defaults")
                # Return default stats for new users
                return Response({
                    'total_videos': 0,
                    'total_comments': 0,
                    'avg_sentiment': 0.0,
                    'recent_activity': []
                }, status=status.HTTP_200_OK)
            
            print(f"✅ Returning stats for user {user_id}: {stats}")
            return Response(stats, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error getting dashboard stats: {str(e)}")
            return Response({
                'error': f'Failed to get dashboard stats: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
