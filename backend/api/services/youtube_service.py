import os
import re
import requests
from typing import List, Dict, Optional
from datetime import datetime
from django.conf import settings
from ..models import Comment, Video


class YouTubeService:
    """Service for interacting with YouTube API"""
    
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.base_url = 'https://www.googleapis.com/youtube/v3'
        
        if not self.api_key:
            raise ValueError("YouTube API key not found in environment variables")
    
    def extract_video_id_from_url(self, url: str) -> str:
        """
        Extract video ID from various YouTube URL formats
        
        Supported formats:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        - https://www.youtube.com/v/VIDEO_ID
        """
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
            r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        raise ValueError(f"Could not extract video ID from URL: {url}")
    
    def get_video_metadata(self, video_id: str) -> Dict:
        """
        Fetch video metadata from YouTube API
        
        Returns:
            Dict containing video title, channel info, stats, etc.
        """
        url = f"{self.base_url}/videos"
        params = {
            'part': 'snippet,statistics',
            'id': video_id,
            'key': self.api_key
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if not data.get('items'):
            raise ValueError(f"Video not found or not accessible: {video_id}")
        
        video_data = data['items'][0]
        snippet = video_data['snippet']
        statistics = video_data.get('statistics', {})
        
        return {
            'video_id': video_id,
            'title': snippet['title'],
            'channel_id': snippet['channelId'],
            'channel_title': snippet['channelTitle'],
            'published_at': datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00')),
            'view_count': int(statistics.get('viewCount', 0)),
            'like_count': int(statistics.get('likeCount', 0)),
            'comment_count': int(statistics.get('commentCount', 0)),
            'description': snippet.get('description', ''),
            'thumbnails': snippet.get('thumbnails', {}),
        }
    
    def fetch_video_transcript(self, video_id: str) -> Optional[str]:
        """Fetch transcript for a YouTube video.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            None as transcript fetching is currently disabled
        """
        return None

    def get_transcript(self, video_id: str) -> str:
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            # Format the transcript into a single string
            transcript_text = '\n'.join([entry['text'] for entry in transcript])
            return transcript_text
        except Exception as e:
            print(f"Error fetching transcript: {e}")
            return None

    def fetch_video_comments(self, video_id: str, max_results: int = 100) -> List[Dict]:
        """
        Fetch comments for a video from YouTube API
        
        Args:
            video_id: YouTube video ID
            max_results: Maximum number of comments to fetch (default: 100)
        
        Returns:
            List of comment dictionaries
        """
        comments = []
        next_page_token = None
        
        while len(comments) < max_results:
            url = f"{self.base_url}/commentThreads"
            params = {
                'part': 'snippet,replies',
                'videoId': video_id,
                'maxResults': min(100, max_results - len(comments)),
                'key': self.api_key
            }
            
            if next_page_token:
                params['pageToken'] = next_page_token
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            for item in data.get('items', []):
                snippet = item['snippet']['topLevelComment']['snippet']
                
                comment_data = {
                    'comment_id': item['id'],
                    'video_id': video_id,
                    'channel_id': snippet['authorChannelId']['value'],
                    'author_name': snippet['authorDisplayName'],
                    'author_channel_url': snippet['authorChannelUrl'],
                    'text': snippet['textDisplay'],
                    'like_count': snippet['likeCount'],
                    'published_at': datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00')),
                }
                
                comments.append(comment_data)
                
                if len(comments) >= max_results:
                    break
            
            # Check if there are more pages
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break
        
        return comments
    
    def store_video_metadata(self, video_data: Dict) -> Video:
        """
        Store or update video metadata in database
        
        Args:
            video_data: Video metadata dictionary
        
        Returns:
            Video model instance
        """
        video, created = Video.objects.get_or_create(
            video_id=video_data['video_id'],
            defaults={
                'title': video_data['title'],
                'channel_id': video_data['channel_id'],
                'channel_title': video_data['channel_title'],
                'published_at': video_data['published_at'],
                'view_count': video_data['view_count'],
                'like_count': video_data['like_count'],
                'comment_count': video_data['comment_count'],
            }
        )
        
        if not created:
            # Update existing video with new data
            video.title = video_data['title']
            video.channel_title = video_data['channel_title']
            video.view_count = video_data['view_count']
            video.like_count = video_data['like_count']
            video.comment_count = video_data['comment_count']
            video.save()
        
        return video
    
    def store_comments(self, comments_data: List[Dict], video: Video) -> List[Comment]:
        """
        Store comments in database
        
        Args:
            comments_data: List of comment dictionaries
            video: Video model instance
        
        Returns:
            List of stored Comment model instances
        """
        stored_comments = []
        
        for comment_data in comments_data:
            comment, created = Comment.objects.get_or_create(
                comment_id=comment_data['comment_id'],
                defaults={
                    'video_id': comment_data['video_id'],
                    'channel_id': comment_data['channel_id'],
                    'author_name': comment_data['author_name'],
                    'author_channel_url': comment_data['author_channel_url'],
                    'text': comment_data['text'],
                    'like_count': comment_data['like_count'],
                    'published_at': comment_data['published_at'],
                }
            )
            
            if not created:
                # Update existing comment
                comment.text = comment_data['text']
                comment.like_count = comment_data['like_count']
                comment.save()
            
            stored_comments.append(comment)
        
        return stored_comments
    
    def process_video_url(self, url: str, fetch_transcript: bool = False) -> Dict:
        """Process a YouTube video URL: fetch metadata, comments, and optionally transcript
        
        Args:
            url: YouTube video URL
            fetch_transcript: Whether to fetch transcript (default: True)
        
        Returns:
            Dict containing video, comments, and transcript info
        """
        # Extract video ID
        video_id = self.extract_video_id_from_url(url)
        
        # Fetch video metadata
        video_data = self.get_video_metadata(video_id)
        
        # Store video metadata
        video = self.store_video_metadata(video_data)
        
        # Fetch comments
        comments_data = self.fetch_video_comments(video_id)
        comments = self.store_comments(comments_data, video)
        
        # Fetch transcript if requested
        # transcript = None
        # if fetch_transcript:
        #     transcript = self.fetch_video_transcript(video_id)
        #     if transcript:
        #         video.transcript = transcript
        #         video.transcript_available = True
        #         video.save()
        
        return {
            'video_id': video_id,
            'video': video,
            'total_comments': len(comments),
            'comments': comments,
        }
