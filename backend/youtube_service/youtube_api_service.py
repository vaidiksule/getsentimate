import os
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import requests


YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def get_video_id_from_url(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    try:
        url = url.strip()
        patterns = [
            r"(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/v\/([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
            return url
        return None
    except Exception as e:
        print(f"Error extracting video ID from URL: {e}")
        return None


def parse_iso8601_duration(duration: str) -> str:
    """Convert ISO8601 duration (e.g. PT1H2M3S) to HH:MM:SS or MM:SS."""
    if not duration or not duration.startswith("PT"):
        return ""
    hours = minutes = seconds = 0
    value = ""
    for ch in duration[2:]:
        if ch.isdigit():
            value += ch
        else:
            if ch == "H":
                hours = int(value or 0)
            elif ch == "M":
                minutes = int(value or 0)
            elif ch == "S":
                seconds = int(value or 0)
            value = ""
    total_seconds = hours * 3600 + minutes * 60 + seconds
    if total_seconds <= 0:
        return ""
    h = total_seconds // 3600
    m = (total_seconds % 3600) // 60
    s = total_seconds % 60
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


class YouTubeAPIService:
    """Service for fetching YouTube video data via the official Data API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or YOUTUBE_API_KEY

    def _get_api_key(self) -> Optional[str]:
        if not self.api_key:
            print("YOUTUBE_API_KEY is not configured")
        return self.api_key

    def fetch_youtube_metadata(self, video_id: str, url: str) -> Tuple[bool, str, Optional[Dict]]:
        api_key = self._get_api_key()
        if not api_key:
            return False, "CONFIG_ERROR: YOUTUBE_API_KEY is not configured", None

        params = {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": api_key,
        }
        resp = requests.get("https://www.googleapis.com/youtube/v3/videos", params=params, timeout=10)

        if resp.status_code != 200:
            try:
                data = resp.json()
            except Exception:
                data = {}
            error_reason = None
            error_message = data.get("error", {}).get("message", "Unknown YouTube API error")
            errors = data.get("error", {}).get("errors", [])
            if errors:
                error_reason = errors[0].get("reason")

            if error_reason in {"quotaExceeded", "dailyLimitExceeded"}:
                return False, f"QUOTA_EXCEEDED: {error_message}", None

            return False, f"YOUTUBE_API_ERROR: {error_message}", None

        data = resp.json()
        items = data.get("items", [])
        if not items:
            # Try oEmbed fallback for basic metadata
            oembed_success, oembed_message, oembed_meta = self.fetch_oembed_metadata(url)
            if oembed_success and oembed_meta:
                return True, oembed_message, oembed_meta
            return False, "INVALID_VIDEO: Video not found or not accessible", None

        item = items[0]
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})
        content_details = item.get("contentDetails", {})

        thumbnails = snippet.get("thumbnails", {})
        thumb = (
            thumbnails.get("high")
            or thumbnails.get("standard")
            or thumbnails.get("medium")
            or thumbnails.get("default")
            or {}
        )
        thumbnail_url = thumb.get("url", "")

        published_at_dt: Optional[datetime] = None
        published_at_raw = snippet.get("publishedAt")
        if published_at_raw:
            try:
                published_at_dt = datetime.fromisoformat(published_at_raw.replace("Z", "+00:00"))
            except Exception:
                published_at_dt = None

        duration_str = parse_iso8601_duration(content_details.get("duration", ""))

        video_details = {
            "id": item.get("id", video_id),
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "thumbnail_url": thumbnail_url,
            "published_at": published_at_dt,
            "duration": duration_str,
            "view_count": int(statistics.get("viewCount", 0) or 0),
            "like_count": int(statistics.get("likeCount", 0) or 0),
            "comment_count": int(statistics.get("commentCount", 0) or 0),
            "category": "",
            "tags": snippet.get("tags", []),
            "language": snippet.get("defaultLanguage", ""),
            "channel_id": snippet.get("channelId", ""),
            "channel_title": snippet.get("channelTitle", ""),
            "channel_url": f"https://www.youtube.com/channel/{snippet.get('channelId', '')}" if snippet.get("channelId") else "",
        }

        return True, "Successfully fetched video metadata via YouTube Data API", video_details

    def fetch_youtube_comments(self, video_id: str, max_comments: int = 100) -> Tuple[bool, str, List[Dict]]:
        api_key = self._get_api_key()
        if not api_key:
            return False, "CONFIG_ERROR: YOUTUBE_API_KEY is not configured", []

        params = {
            "part": "snippet",
            "videoId": video_id,
            "maxResults": min(max_comments, 100),
            "order": "relevance",
            "key": api_key,
        }

        resp = requests.get("https://www.googleapis.com/youtube/v3/commentThreads", params=params, timeout=10)

        if resp.status_code != 200:
            try:
                data = resp.json()
            except Exception:
                data = {}
            error_reason = None
            error_message = data.get("error", {}).get("message", "Unknown YouTube comments API error")
            errors = data.get("error", {}).get("errors", [])
            if errors:
                error_reason = errors[0].get("reason")

            if error_reason in {"quotaExceeded", "dailyLimitExceeded"}:
                return False, f"QUOTA_EXCEEDED: {error_message}", []

            # For non-quota errors, just log and return empty comments so metadata can still be used
            print(f"YouTube comments API error: {error_message}")
            return True, f"COMMENTS_ERROR: {error_message}", []

        data = resp.json()
        items = data.get("items", [])
        comments: List[Dict] = []
        for item in items:
            snippet = item.get("snippet", {})
            top = snippet.get("topLevelComment", {}).get("snippet", {})
            text = top.get("textDisplay") or top.get("textOriginal") or ""
            if not text:
                continue
            comment = {
                "id": item.get("id", ""),
                "author_name": top.get("authorDisplayName", ""),
                "author_channel_id": top.get("authorChannelId", {}).get("value", ""),
                "author_profile_picture": top.get("authorProfileImageUrl", ""),
                "text": text,
                "like_count": int(top.get("likeCount", 0) or 0),
                "published_at": top.get("publishedAt"),
                "updated_at": top.get("updatedAt"),
            }
            comments.append(comment)

        return True, f"Successfully fetched {len(comments)} comments via YouTube Data API", comments

    def fetch_oembed_metadata(self, url: str) -> Tuple[bool, str, Optional[Dict]]:
        """Fallback: use YouTube oEmbed for basic metadata if Data API fails or returns no items."""
        try:
            resp = requests.get(
                "https://www.youtube.com/oembed",
                params={"url": url, "format": "json"},
                timeout=10,
            )
            if resp.status_code != 200:
                return False, f"OEMBED_ERROR: HTTP {resp.status_code}", None
            data = resp.json()
            video_details = {
                "id": None,
                "title": data.get("title", ""),
                "description": "",
                "thumbnail_url": data.get("thumbnail_url", ""),
                "published_at": None,
                "duration": "",
                "view_count": 0,
                "like_count": 0,
                "comment_count": 0,
                "category": "",
                "tags": [],
                "language": "",
                "channel_id": "",
                "channel_title": data.get("author_name", ""),
                "channel_url": "",
            }
            return True, "Successfully fetched basic metadata via oEmbed", video_details
        except Exception as e:
            print(f"Error fetching oEmbed metadata: {e}")
            return False, f"OEMBED_ERROR: {e}", None

    def analyze_video_by_url(self, url: str, max_comments: int = 100) -> Tuple[bool, str, Optional[Dict]]:
        """Analyze a YouTube video by URL using the YouTube Data API (and oEmbed fallback)."""
        try:
            video_id = get_video_id_from_url(url)
            if not video_id:
                return False, "INVALID_VIDEO: Invalid YouTube URL format", None

            meta_success, meta_message, video_details = self.fetch_youtube_metadata(video_id, url)
            if not meta_success or not video_details:
                # Propagate quota errors / invalid video; for other errors, message already descriptive
                return False, meta_message, None

            comments_success, comments_message, comments = self.fetch_youtube_comments(video_id, max_comments)
            if not comments_success and comments_message.startswith("QUOTA_EXCEEDED:"):
                # If comments quota exceeded, treat as hard failure so caller can return 429
                return False, comments_message, None

            total_comments = len(comments)
            analysis_data = {
                "video_id": video_id,
                "video_details": video_details,
                "comments": comments,
                "total_comments_fetched": total_comments,
                "analysis_timestamp": datetime.now().isoformat(),
            }

            if total_comments > 0:
                return True, f"Successfully analyzed video with {total_comments} comments", analysis_data
            return True, "Successfully analyzed video (no comments available)", analysis_data

        except Exception as e:
            print(f"Error analyzing video by URL with YouTube Data API: {e}")
            return False, f"Analysis failed: {str(e)}", None
