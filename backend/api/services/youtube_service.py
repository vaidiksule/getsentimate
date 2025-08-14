import os
import re
import requests
from typing import List, Dict, Optional
from datetime import datetime
from django.conf import settings
from ..models import Comment, Video
from dotenv import load_dotenv


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

    def fetch_video_comments(self, video_id: str, max_results: int = 100) -> List[Dict]:
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

    def store_video_metadata(self, video_data: Dict) -> Video:
        """
        Saves or updates video metadata in the database.
        Uses Django ORM's get_or_create to avoid duplicates.
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
            # Update fields if video already exists
            video.title = video_data['title']
            video.channel_title = video_data['channel_title']
            video.view_count = video_data['view_count']
            video.like_count = video_data['like_count']
            video.comment_count = video_data['comment_count']
            video.save()

        return video

    def store_comments(self, comments_data: List[Dict], video: Video) -> List[Comment]:
        """
        Saves comments in the database.
        Updates existing ones if text or like count changes.
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
                # Update fields for existing comment
                comment.text = comment_data['text']
                comment.like_count = comment_data['like_count']
                comment.save()

            stored_comments.append(comment)

        return stored_comments

    def process_video_url(self, url: str, fetch_transcript: bool = False) -> Dict:
        """
        High-level method to process a YouTube video URL:
        1. Extracts video ID
        2. Fetches metadata
        3. Stores metadata
        4. Fetches comments
        5. Optionally fetches transcript

        Returns:
            Dict containing:
            - video_id
            - video object
            - total_comments
            - comments list
        """
        # Extract ID from given URL
        video_id = self.extract_video_id_from_url(url)

        # Fetch and store metadata
        video_data = self.get_video_metadata(video_id)
        video = self.store_video_metadata(video_data)

        # Fetch and store comments
        comments_data = self.fetch_video_comments(video_id)
        comments = self.store_comments(comments_data, video)

        # Optional transcript fetching (currently disabled)
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
