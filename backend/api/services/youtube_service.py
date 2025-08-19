import os
import re
import requests
from typing import List, Dict, Optional
from datetime import datetime
from django.conf import settings
from dotenv import load_dotenv
from .mongodb_service import MongoDBService

load_dotenv()

MAX_COMMENTS_TO_FETCH = 20

class YouTubeService:
    """Service for interacting with the YouTube Data API"""

    def __init__(self):
        # Load YouTube API key from environment variables
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.base_url = 'https://www.googleapis.com/youtube/v3'

        # Fail early if no API key is found
        if not self.api_key:
            raise ValueError("YouTube API key not found in environment variables")

    def extract_video_id_from_url(self, url: str) -> str:
        """
        Extracts the video ID from a given YouTube URL.

        Supports:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        - https://www.youtube.com/v/VIDEO_ID
        """
        patterns = [
            # Covers watch?v=, youtu.be/, embed/, and v/ formats
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
            # Covers complex watch URLs with multiple query params
            r'youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})',
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        # Raise error if no valid ID found
        raise ValueError(f"Could not extract video ID from URL: {url}")

    def get_video_metadata(self, video_id: str) -> Dict:
        """
        Retrieves video metadata from YouTube API.

        Returns:
            Dict containing:
            - title, channel info, publish date
            - view count, like count, comment count
            - description, thumbnails
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
        """
        (Currently unused) Placeholder method for fetching transcripts.
        Always returns None for now.
        """
        return None

    def get_transcript(self, video_id: str) -> str:
        """
        Fetches transcript using youtube_transcript_api (if available).

        Returns:
            Full transcript text as a string, or None if unavailable.
        """
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = '\n'.join([entry['text'] for entry in transcript])
            return transcript_text
        except Exception as e:
            print(f"Error fetching transcript: {e}")
            return None

    def fetch_video_comments(self, video_id: str, max_results: int = MAX_COMMENTS_TO_FETCH) -> List[Dict]:
        """
        Fetches comments for a given video.

        Args:
            video_id: YouTube video ID
            max_results: Maximum number of comments to retrieve (default 100)

        Returns:
            List of comment dictionaries with:
            - comment_id, author, text, like count, publish date
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

            # Move to next page if available
            next_page_token = data.get('nextPageToken')
            if not next_page_token:
                break

        return comments

    def store_video_metadata(self, video_data: Dict, user_google_id: str) -> str:
        """
        Saves or updates video metadata in MongoDB.
        Returns the video ID.
        """
        try:
            mongo_service = MongoDBService()
            video_id = mongo_service.store_video(video_data, user_google_id)
            mongo_service.close_connection()
            return video_id
        except Exception as e:
            raise Exception(f"Failed to store video in MongoDB: {str(e)}")

    def store_comments(self, comments_data: List[Dict], video_id: str, user_google_id: str) -> List[str]:
        """
        Saves comments in MongoDB.
        Returns list of comment IDs.
        """
        try:
            mongo_service = MongoDBService()
            comment_ids = mongo_service.store_comments(comments_data, video_id, user_google_id)
            mongo_service.close_connection()
            return comment_ids
        except Exception as e:
            raise Exception(f"Failed to store comments in MongoDB: {str(e)}")

    def process_video_url(self, url: str, user_google_id: str, fetch_transcript: bool = False) -> Dict:
        """
        High-level method to process a YouTube video URL:
        1. Extracts video ID
        2. Fetches metadata
        3. Stores metadata in MongoDB linked to user
        4. Fetches comments
        5. Stores comments in MongoDB linked to user and video

        Args:
            url: YouTube video URL
            user_google_id: Google ID of the user processing the video
            fetch_transcript: Whether to fetch video transcript

        Returns:
            Dict containing:
            - video_id
            - video_data
            - total_comments
            - comments_count
        """
        # Extract ID from given URL
        video_id = self.extract_video_id_from_url(url)

        # Fetch and store metadata
        video_data = self.get_video_metadata(video_id)
        stored_video_id = self.store_video_metadata(video_data, user_google_id)

        # Fetch and store comments
        comments_data = self.fetch_video_comments(video_id)
        comment_ids = self.store_comments(comments_data, video_id, user_google_id)

        # Optional transcript fetching (currently disabled)
        # if fetch_transcript:
        #     transcript = self.fetch_video_transcript(video_id)
        #     if transcript:
        #         # Store transcript in MongoDB if needed
        #         pass

        return {
            'video_id': video_id,
            'video_data': video_data,
            'total_comments': len(comments_data),
            'comments_count': len(comment_ids),
        }
