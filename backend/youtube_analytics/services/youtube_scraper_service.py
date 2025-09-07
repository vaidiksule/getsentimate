import os
import re
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import yt_dlp
from youtube_comment_downloader import YoutubeCommentDownloader


class YouTubeScraperService:
    """Service for scraping YouTube video data using yt-dlp (no API key required)"""
    
    def __init__(self):
        self.extractor = None
        self._initialize_extractor()
    
    def _initialize_extractor(self):
        """Initialize yt-dlp extractor with appropriate options"""
        try:
            # Configure yt-dlp options
            self.ydl_opts = {
                'quiet': True,  # Suppress output
                'no_warnings': True,  # Suppress warnings
                'extract_flat': False,  # Extract full video info
                'writesubtitles': False,  # Don't download subtitles
                'writeautomaticsub': False,  # Don't download auto subtitles
                'skip_download': True,  # Don't download video/audio
                'extract_comments': True,  # Extract comments
                'max_comments': 100,  # Limit comments
            }
        except Exception as e:
            print(f"Failed to initialize yt-dlp extractor: {e}")
            self.extractor = None
    
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
        Analyze any YouTube video by URL using yt-dlp scraping
        
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
            
            # Update max comments in options
            self.ydl_opts['max_comments'] = min(max_comments, 1000)  # Limit to 1000 max
            
            # Extract video information
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                try:
                    # Extract video info
                    video_info = ydl.extract_info(url, download=False)
                    
                    if not video_info:
                        return False, "Video not found or not accessible", None
                    
                    # Extract video details
                    video_details = self._extract_video_details(video_info)
                    
                    # Extract comments using youtube-comment-downloader
                    comments = self._extract_comments_with_downloader(video_id, max_comments)
                    
                    # If no comments found, still return video info but with empty comments
                    if not comments:
                        print("No comments found, returning video info only")
                        comments = []
                    
                    # Prepare analysis data
                    analysis_data = {
                        'video_id': video_id,
                        'video_details': video_details,
                        'comments': comments,
                        'total_comments_fetched': len(comments),
                        'analysis_timestamp': datetime.now().isoformat()
                    }
                    
                    if len(comments) > 0:
                        return True, f"Successfully analyzed video with {len(comments)} comments", analysis_data
                    else:
                        return True, "Successfully analyzed video (no comments available)", analysis_data
                    
                except Exception as extract_error:
                    print(f"Error extracting video info: {extract_error}")
                    return False, f"Failed to extract video information: {str(extract_error)}", None
                    
        except Exception as e:
            print(f"Error analyzing video by URL: {e}")
            return False, f"Analysis failed: {str(e)}", None
    
    def _extract_video_details(self, video_info: Dict) -> Dict:
        """Extract video details from yt-dlp info"""
        try:
            # Get thumbnail URL (prefer high quality)
            thumbnail_url = ""
            if 'thumbnails' in video_info and video_info['thumbnails']:
                # Get the highest quality thumbnail
                thumbnails = sorted(video_info['thumbnails'], 
                                  key=lambda x: x.get('width', 0) * x.get('height', 0), 
                                  reverse=True)
                thumbnail_url = thumbnails[0]['url'] if thumbnails else ""
            elif 'thumbnail' in video_info:
                thumbnail_url = video_info['thumbnail']
            
            # Parse duration
            duration_str = ""
            if 'duration' in video_info and video_info['duration']:
                duration_seconds = video_info['duration']
                hours = duration_seconds // 3600
                minutes = (duration_seconds % 3600) // 60
                seconds = duration_seconds % 60
                if hours > 0:
                    duration_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                else:
                    duration_str = f"{minutes:02d}:{seconds:02d}"
            
            # Parse upload date
            upload_date = None
            if 'upload_date' in video_info and video_info['upload_date']:
                try:
                    upload_date = datetime.strptime(video_info['upload_date'], '%Y%m%d')
                except:
                    pass
            elif 'timestamp' in video_info and video_info['timestamp']:
                try:
                    upload_date = datetime.fromtimestamp(video_info['timestamp'])
                except:
                    pass
            
            video_details = {
                'id': video_info.get('id', ''),
                'title': video_info.get('title', ''),
                'description': video_info.get('description', ''),
                'thumbnail_url': thumbnail_url,
                'published_at': upload_date,
                'duration': duration_str,
                'view_count': video_info.get('view_count', 0),
                'like_count': video_info.get('like_count', 0),
                'comment_count': video_info.get('comment_count', 0),
                'category': video_info.get('categories', [''])[0] if video_info.get('categories') else '',
                'tags': video_info.get('tags', []),
                'language': video_info.get('language', ''),
                'channel_id': video_info.get('channel_id', ''),
                'channel_title': video_info.get('uploader', ''),
                'channel_url': video_info.get('uploader_url', ''),
            }
            
            return video_details
            
        except Exception as e:
            print(f"Error extracting video details: {e}")
            return {}
    
    def _extract_comments(self, video_info: Dict) -> List[Dict]:
        """Extract comments from yt-dlp info"""
        try:
            comments = []
            
            # Check if comments are available
            if 'comments' not in video_info or not video_info['comments']:
                return comments
            
            for comment_data in video_info['comments']:
                try:
                    # Extract comment information
                    comment = {
                        'id': comment_data.get('id', ''),
                        'author_name': comment_data.get('author', ''),
                        'author_channel_id': comment_data.get('author_id', ''),
                        'author_profile_picture': comment_data.get('author_thumbnail', ''),
                        'text': comment_data.get('text', ''),
                        'like_count': comment_data.get('like_count', 0),
                        'published_at': None,
                        'updated_at': None,
                    }
                    
                    # Parse timestamps
                    if 'timestamp' in comment_data and comment_data['timestamp']:
                        try:
                            comment['published_at'] = datetime.fromtimestamp(comment_data['timestamp'])
                        except:
                            pass
                    
                    comments.append(comment)
                    
                except Exception as comment_error:
                    print(f"Error processing comment: {comment_error}")
                    continue
            
            return comments
            
        except Exception as e:
            print(f"Error extracting comments: {e}")
            return []
    
    def _extract_comments_with_downloader(self, video_id: str, max_comments: int = 100) -> List[Dict]:
        """Extract comments using youtube-comment-downloader"""
        try:
            downloader = YoutubeCommentDownloader()
            comments = []
            
            # Get comments from the video
            comment_generator = downloader.get_comments_from_url(f"https://www.youtube.com/watch?v={video_id}")
            
            count = 0
            for comment_data in comment_generator:
                if count >= max_comments:
                    break
                    
                try:
                    # Extract comment information
                    comment = {
                        'id': comment_data.get('cid', ''),
                        'author_name': comment_data.get('author', ''),
                        'author_channel_id': comment_data.get('author_id', ''),
                        'author_profile_picture': comment_data.get('author_avatar', ''),
                        'text': comment_data.get('text', ''),
                        'like_count': comment_data.get('votes', 0),
                        'published_at': None,
                        'updated_at': None,
                    }
                    
                    # Parse timestamps
                    if 'time_parsed' in comment_data and comment_data['time_parsed']:
                        try:
                            comment['published_at'] = comment_data['time_parsed']
                        except:
                            pass
                    
                    comments.append(comment)
                    count += 1
                    
                except Exception as comment_error:
                    print(f"Error processing comment: {comment_error}")
                    continue
            
            return comments
            
        except Exception as e:
            print(f"Error extracting comments with downloader: {e}")
            return []
    
    def test_connection(self, test_url: str = "https://www.youtube.com/watch?v=dQw4w9WgXcQ") -> bool:
        """Test if yt-dlp scraping is working"""
        try:
            success, message, data = self.analyze_video_by_url(test_url, 5)
            return success
        except Exception as e:
            print(f"yt-dlp connection test failed: {e}")
            return False


# Global instance - lazy initialization
youtube_scraper_service = None

def get_youtube_scraper_service():
    """Get or create YouTube scraper service instance"""
    global youtube_scraper_service
    if youtube_scraper_service is None:
        youtube_scraper_service = YouTubeScraperService()
    return youtube_scraper_service
