import os
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
import requests
from django.conf import settings
from django.utils import timezone


class YouTubeService:
    """Service for interacting with YouTube Data API v3"""
    
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.client_secrets_file = os.getenv('GOOGLE_CLIENT_SECRETS_FILE', 'client_secrets.json')
        self.scopes = [
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/youtube.force-ssl'
        ]
        self.youtube = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize YouTube API service"""
        try:
            if self.api_key:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            else:
                # Fallback to OAuth flow
                self.youtube = build('youtube', 'v3', credentials=self._get_oauth_credentials())
        except Exception as e:
            print(f"Failed to initialize YouTube service: {e}")
            self.youtube = None
    
    def _get_oauth_credentials(self) -> Optional[Credentials]:
        """Get OAuth credentials for YouTube API access"""
        try:
            creds = None
            token_file = 'token.json'
            
            if os.path.exists(token_file):
                creds = Credentials.from_authorized_user_file(token_file, self.scopes)
            
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.client_secrets_file, self.scopes)
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                with open(token_file, 'w') as token:
                    token.write(creds.to_json())
            
            return creds
        except Exception as e:
            print(f"Failed to get OAuth credentials: {e}")
            return None
    
    def get_user_channels(self, access_token: str) -> List[Dict]:
        """Get all YouTube channels for the authenticated user"""
        try:
            if not self.youtube:
                return []
            
            # Get user's channel
            channels_response = self.youtube.channels().list(
                part='snippet,statistics,brandingSettings',
                mine=True
            ).execute()
            
            channels = []
            for channel in channels_response.get('items', []):
                channel_data = {
                    'id': channel['id'],
                    'title': channel['snippet']['title'],
                    'description': channel['snippet'].get('description', ''),
                    'custom_url': channel['snippet'].get('customUrl'),
                    'thumbnail_url': channel['snippet']['thumbnails']['default']['url'],
                    'subscriber_count': int(channel['statistics'].get('subscriberCount', 0)),
                    'video_count': int(channel['statistics'].get('videoCount', 0)),
                    'view_count': int(channel['statistics'].get('viewCount', 0)),
                    'country': channel['snippet'].get('country'),
                    'published_at': datetime.fromisoformat(
                        channel['snippet']['publishedAt'].replace('Z', '+00:00')
                    )
                }
                channels.append(channel_data)
            
            return channels
        except HttpError as e:
            print(f"YouTube API error getting channels: {e}")
            return []
        except Exception as e:
            print(f"Error getting user channels: {e}")
            return []
    
    def get_channel_videos(self, channel_id: str, max_results: int = 50) -> List[Dict]:
        """Get videos from a specific channel"""
        try:
            if not self.youtube:
                return []
            
            # Get channel's uploads playlist
            channels_response = self.youtube.channels().list(
                part='contentDetails',
                id=channel_id
            ).execute()
            
            if not channels_response.get('items'):
                return []
            
            uploads_playlist_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            
            # Get videos from uploads playlist
            videos_response = self.youtube.playlistItems().list(
                part='snippet,contentDetails',
                playlistId=uploads_playlist_id,
                maxResults=max_results
            ).execute()
            
            videos = []
            for item in videos_response.get('items', []):
                video_id = item['contentDetails']['videoId']
                
                # Get detailed video information
                video_details = self.get_video_details(video_id)
                if video_details:
                    videos.append(video_details)
            
            return videos
        except HttpError as e:
            print(f"YouTube API error getting channel videos: {e}")
            return []
        except Exception as e:
            print(f"Error getting channel videos: {e}")
            return []
    
    def get_video_details(self, video_id: str) -> Optional[Dict]:
        """Get detailed information about a specific video"""
        try:
            if not self.youtube:
                return None
            
            video_response = self.youtube.videos().list(
                part='snippet,contentDetails,statistics',
                id=video_id
            ).execute()
            
            if not video_response.get('items'):
                return None
            
            video = video_response['items'][0]
            snippet = video['snippet']
            content_details = video['contentDetails']
            statistics = video['statistics']
            
            video_data = {
                'id': video_id,
                'title': snippet['title'],
                'description': snippet.get('description', ''),
                'thumbnail_url': snippet['thumbnails']['high']['url'],
                'published_at': datetime.fromisoformat(
                    snippet['publishedAt'].replace('Z', '+00:00')
                ),
                'duration': content_details['duration'],
                'view_count': int(statistics.get('viewCount', 0)),
                'like_count': int(statistics.get('likeCount', 0)),
                'comment_count': int(statistics.get('commentCount', 0)),
                'category_id': snippet.get('categoryId'),
                'tags': snippet.get('tags', []),
                'language': snippet.get('defaultLanguage'),
                'channel_id': snippet['channelId'],
                'channel_title': snippet['channelTitle']
            }
            
            return video_data
        except HttpError as e:
            print(f"YouTube API error getting video details: {e}")
            return None
        except Exception as e:
            print(f"Error getting video details: {e}")
            return None
    
    def get_video_comments(self, video_id: str, max_results: int = 100) -> List[Dict]:
        """Get comments for a specific video"""
        try:
            if not self.youtube:
                return []
            
            comments_response = self.youtube.commentThreads().list(
                part='snippet,replies',
                videoId=video_id,
                maxResults=max_results,
                order='relevance'  # Get most relevant comments first
            ).execute()
            
            comments = []
            for item in comments_response.get('items', []):
                comment = item['snippet']['topLevelComment']['snippet']
                
                comment_data = {
                    'id': item['id'],
                    'author_name': comment['authorDisplayName'],
                    'author_channel_id': comment['authorChannelId']['value'],
                    'author_profile_picture': comment['authorProfileImageUrl'],
                    'text': comment['textDisplay'],
                    'like_count': comment['likeCount'],
                    'published_at': datetime.fromisoformat(
                        comment['publishedAt'].replace('Z', '+00:00')
                    ),
                    'updated_at': datetime.fromisoformat(
                        comment['updatedAt'].replace('Z', '+00:00')
                    ) if comment.get('updatedAt') else None
                }
                
                comments.append(comment_data)
            
            return comments
        except HttpError as e:
            if e.resp.status == 403:
                print(f"Comments disabled for video {video_id}")
                return []
            else:
                print(f"YouTube API error getting comments: {e}")
                return []
        except Exception as e:
            print(f"Error getting video comments: {e}")
            return []
    
    def refresh_access_token(self, refresh_token: str) -> Optional[Dict]:
        """Refresh YouTube access token"""
        try:
            # This would typically be done through Google's OAuth service
            # For now, we'll return a placeholder
            return {
                'access_token': 'new_access_token',
                'expires_in': 3600,
                'token_type': 'Bearer'
            }
        except Exception as e:
            print(f"Error refreshing access token: {e}")
            return None
    
    def test_connection(self) -> bool:
        """Test if YouTube API connection is working"""
        try:
            if not self.youtube:
                return False
            
            # Try to make a simple API call
            response = self.youtube.videos().list(
                part='snippet',
                id='dQw4w9WgXcQ'  # Rick Roll video ID for testing
            ).execute()
            
            return 'items' in response
        except Exception as e:
            print(f"YouTube API connection test failed: {e}")
            return False
    
    def extract_video_id_from_url(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from various URL formats"""
        try:
            # Remove any whitespace
            url = url.strip()
            
            # YouTube URL patterns
            patterns = [
                r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
                r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
                r'youtube\.com\/v\/([a-zA-Z0-9_-]{11})',
                r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, url)
                if match:
                    return match.group(1)
            
            # If no pattern matches, check if it's already a video ID
            if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
                return url
                
            return None
        except Exception as e:
            print(f"Error extracting video ID from URL: {e}")
            return None
    
    def analyze_video_by_url(self, url: str, max_comments: int = 100) -> Tuple[bool, str, Optional[Dict]]:
        """
        Analyze any YouTube video by URL using public API key
        
        Args:
            url: YouTube video URL
            max_comments: Maximum number of comments to analyze
            
        Returns:
            Tuple of (success, message, analysis_data)
        """
        try:
            # Extract video ID from URL
            video_id = self.extract_video_id_from_url(url)
            if not video_id:
                return False, "Invalid YouTube URL format", None
            
            # Create a new YouTube service instance with API key for public access
            youtube_service = self._create_public_youtube_service()
            if not youtube_service:
                return False, "YouTube API not configured. Please set YOUTUBE_API_KEY environment variable.", None
            
            # Get video details using public API
            video_details = self._get_video_details_public(youtube_service, video_id)
            if not video_details:
                return False, "Video not found or not accessible", None
            
            # Check if comments are enabled
            if video_details.get('comment_count', 0) == 0:
                return False, "Comments are disabled for this video", None
            
            # Get comments using public API
            comments = self._get_video_comments_public(youtube_service, video_id, max_comments)
            if not comments:
                return False, "No comments found or comments not accessible", None
            
            # Prepare analysis data
            analysis_data = {
                'video_id': video_id,
                'video_details': video_details,
                'comments': comments,
                'total_comments_fetched': len(comments),
                'analysis_timestamp': timezone.now().isoformat()
            }
            
            return True, f"Successfully analyzed video with {len(comments)} comments", analysis_data
            
        except Exception as e:
            print(f"Error analyzing video by URL: {e}")
            return False, f"Analysis failed: {str(e)}", None
    
    def _create_public_youtube_service(self):
        """Create YouTube service instance using public API key"""
        try:
            api_key = os.getenv('YOUTUBE_API_KEY')
            if not api_key:
                print("YOUTUBE_API_KEY not found in environment variables")
                return None
            
            return build('youtube', 'v3', developerKey=api_key)
        except Exception as e:
            print(f"Failed to create public YouTube service: {e}")
            return None
    
    def _get_video_details_public(self, youtube_service, video_id: str) -> Optional[Dict]:
        """Get video details using public API"""
        try:
            video_response = youtube_service.videos().list(
                part='snippet,contentDetails,statistics',
                id=video_id
            ).execute()
            
            if not video_response.get('items'):
                return None
            
            video = video_response['items'][0]
            snippet = video['snippet']
            content_details = video['contentDetails']
            statistics = video['statistics']
            
            video_data = {
                'id': video_id,
                'title': snippet['title'],
                'description': snippet.get('description', ''),
                'thumbnail_url': snippet['thumbnails']['high']['url'],
                'published_at': datetime.fromisoformat(
                    snippet['publishedAt'].replace('Z', '+00:00')
                ),
                'duration': content_details['duration'],
                'view_count': int(statistics.get('viewCount', 0)),
                'like_count': int(statistics.get('likeCount', 0)),
                'comment_count': int(statistics.get('commentCount', 0)),
                'category_id': snippet.get('categoryId'),
                'tags': snippet.get('tags', []),
                'language': snippet.get('defaultLanguage'),
                'channel_id': snippet['channelId'],
                'channel_title': snippet['channelTitle']
            }
            
            return video_data
        except Exception as e:
            print(f"Error getting video details: {e}")
            return None
    
    def _get_video_comments_public(self, youtube_service, video_id: str, max_results: int = 100) -> List[Dict]:
        """Get comments using public API"""
        try:
            comments_response = youtube_service.commentThreads().list(
                part='snippet,replies',
                videoId=video_id,
                maxResults=max_results,
                order='relevance'  # Get most relevant comments first
            ).execute()
            
            comments = []
            for item in comments_response.get('items', []):
                comment = item['snippet']['topLevelComment']['snippet']
                
                comment_data = {
                    'id': item['id'],
                    'author_name': comment['authorDisplayName'],
                    'author_channel_id': comment.get('authorChannelId', {}).get('value'),
                    'author_profile_picture': comment['authorProfileImageUrl'],
                    'text': comment['textDisplay'],
                    'like_count': comment['likeCount'],
                    'published_at': datetime.fromisoformat(
                        comment['publishedAt'].replace('Z', '+00:00')
                    ),
                    'updated_at': datetime.fromisoformat(
                        comment['updatedAt'].replace('Z', '+00:00')
                    ) if comment.get('updatedAt') else None
                }
                
                comments.append(comment_data)
            
            return comments
        except Exception as e:
            if hasattr(e, 'resp') and e.resp.status == 403:
                print(f"Comments disabled for video {video_id}")
                return []
            else:
                print(f"YouTube API error getting comments: {e}")
                return []


# Global instance - lazy initialization
youtube_service = None

def get_youtube_service():
    """Get or create YouTube service instance"""
    global youtube_service
    if youtube_service is None:
        youtube_service = YouTubeService()
    return youtube_service
