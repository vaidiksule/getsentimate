import logging
from typing import Dict, List, Any
from itertools import islice
from youtube_comment_downloader import YoutubeCommentDownloader

logger = logging.getLogger(__name__)


class YouTubeFetchService:
    def fetch_video_data(self, url: str, max_comments: int = 150) -> Dict[str, Any]:
        """
        Fetch video metadata and comments in a single pass.
        Returns:
            {
                "metadata": { ... },
                "comments": [ ... ]
            }
        """
        return {
            "metadata": self._fetch_metadata(url),
            "comments": self._fetch_comments(url, max_comments),
        }

    def _fetch_metadata(self, url: str) -> Dict[str, Any]:
        """
        Fetch video metadata using official API or oEmbed fallback.
        Avoids yt-dlp bot detection issues.
        """
        from youtube_service.youtube_api_service import (
            YouTubeAPIService,
            get_video_id_from_url,
        )

        try:
            video_id = get_video_id_from_url(url)
            api_service = YouTubeAPIService()

            # 1. Try official API (if key exists) or oEmbed
            success, message, metadata = api_service.fetch_youtube_metadata(
                video_id, url
            )

            if success and metadata:
                return {
                    "video_id": video_id,
                    "title": metadata.get("title"),
                    "channel": metadata.get("channel_title"),
                    "views": metadata.get("view_count"),
                    "upload_date": metadata.get("published_at").strftime("%Y-%m-%d")
                    if metadata.get("published_at")
                    else None,
                    "thumbnail": metadata.get("thumbnail_url"),
                    "duration": metadata.get("duration"),
                    "likes": metadata.get("like_count"),
                }

            logger.warning(
                f"Metadata fetch fallback triggered for {url}. Message: {message}"
            )

            # 2. Final Fallback: Basic URL extraction if everything fails
            return {
                "video_id": video_id,
                "title": "YouTube Video",
                "channel": "Unknown",
                "views": 0,
                "upload_date": None,
                "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                if video_id
                else None,
                "duration": "0:00",
                "likes": 0,
            }

        except Exception as e:
            logger.error(f"Metadata fetch failed: {e}")
            raise ValueError(f"Could not fetch video details: {str(e)}")

    def _fetch_comments(self, url: str, max_comments: int) -> List[Dict[str, Any]]:
        try:
            downloader = YoutubeCommentDownloader()
            # method get_comments_from_url returns a generator
            generator = downloader.get_comments_from_url(
                url, sort_by=1
            )  # 1 = Top comments, 0 = Newest

            # Fetch slightly more to account for cleaner filtering
            fetch_limit = int(max_comments * 1.4)  # 40% buffer

            comments = []
            for comment in islice(generator, fetch_limit):
                comments.append(
                    {
                        "text": comment.get("text"),
                        "author": comment.get("author"),
                        "likes": comment.get("votes"),  # votes usually maps to likes
                        "replies": comment.get(
                            "reply"
                        ),  # boolean or count? usually not reliable count in basic fetch
                        "cid": comment.get("cid"),
                        "time": comment.get("time"),
                    }
                )

            return comments
        except Exception as e:
            logger.error(f"Comment fetch failed: {e}")
            # If comments fail (disabled?) we might still want to proceed with 0 comments?
            # The prompt relies on comments. Let's return empty list.
            return []
