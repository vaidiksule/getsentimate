import os
import json
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


# Global instance - lazy initialization
youtube_service = None

def get_youtube_service():
    """Get or create YouTube service instance"""
    global youtube_service
    if youtube_service is None:
        youtube_service = YouTubeService()
    return youtube_service
