import logging
from typing import Dict, List, Any
import yt_dlp
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
        try:
            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "extract_flat": True,
                "skip_download": True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    "title": info.get("title"),
                    "channel": info.get("uploader"),
                    "views": info.get("view_count"),
                    "upload_date": info.get("upload_date"),
                    "thumbnail": info.get("thumbnail"),
                    "duration": info.get("duration"),
                    "likes": info.get(
                        "like_count"
                    ),  # Often None in yt-dlp recently, but we try
                }
        except Exception as e:
            logger.error(f"Metadata fetch failed: {e}")
            raise ValueError("Could not fetch video details. Is the URL correct?")

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
