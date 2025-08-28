import os
import time
from typing import List, Dict, Optional, Tuple
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from django.utils import timezone
from ..models import Video, Comment, Channel
import logging

logger = logging.getLogger(__name__)

class CommentService:
    """Service for fetching and managing YouTube video comments"""
    
    def __init__(self, user):
        self.user = user
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        
    def _get_youtube_service(self) -> Optional[object]:
        """Create and return YouTube API service with user credentials"""
        try:
            if not self.user.youtube_access_token:
                logger.error(f"No YouTube access token for user {self.user.username}")
                return None
                
            credentials = Credentials(
                self.user.youtube_access_token,
                refresh_token=self.user.youtube_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=[
                    'https://www.googleapis.com/auth/youtube.force-ssl',
                    'https://www.googleapis.com/auth/youtube.force-ssl',
                    'https://www.googleapis.com/auth/youtube'
                ]
            )
            
            return build('youtube', 'v3', credentials=credentials)
            
        except Exception as e:
            logger.error(f"Failed to create YouTube service for user {self.user.username}: {str(e)}")
            return None
    
    def fetch_video_comments(self, video_id: str, max_results: int = 100) -> Tuple[bool, str, List[Dict]]:
        """
        Fetch comments for a specific video
        
        Args:
            video_id: YouTube video ID
            max_results: Maximum number of comments to fetch
            
        Returns:
            Tuple of (success, message, comments_data)
        """
        try:
            logger.info(f"Starting comment fetch for video {video_id}, max_results: {max_results}")
            
            # Get YouTube service
            youtube = self._get_youtube_service()
            if not youtube:
                return False, "YouTube service not available", []
            
            # Check if video exists and user has access
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != self.user:
                    return False, "Access denied to this video", []
            except Video.DoesNotExist:
                return False, "Video not found", []
            
            comments_data = []
            next_page_token = None
            total_fetched = 0
            
            # Fetch comments with pagination
            while total_fetched < max_results:
                try:
                    # Calculate how many comments to fetch in this batch
                    batch_size = min(100, max_results - total_fetched)  # YouTube API max is 100 per request
                    
                    # Request comments
                    request = youtube.commentThreads().list(
                        part='snippet,replies',
                        videoId=video_id,
                        maxResults=batch_size,
                        pageToken=next_page_token,
                        order='relevance'  # Get most relevant comments first
                    )
                    
                    print(f"Making YouTube API request for video {video_id}")  # Debug log
                    response = request.execute()
                    print(f"YouTube API response keys: {list(response.keys())}")  # Debug log
                    print(f"YouTube API response items count: {len(response.get('items', []))}")  # Debug log
                    
                    # Process comments from this batch
                    for item in response.get('items', []):
                        if total_fetched >= max_results:
                            break
                            
                        comment_data = self._process_comment_item(item, video)
                        if comment_data:
                            comments_data.append(comment_data)
                            total_fetched += 1
                    
                    # Check if there are more pages
                    next_page_token = response.get('nextPageToken')
                    print(f"Next page token: {next_page_token}")  # Debug log
                    if not next_page_token:
                        break
                        
                    # Rate limiting - YouTube API has quotas
                    time.sleep(0.1)  # Small delay between requests
                    
                except Exception as batch_error:
                    print(f"Error fetching comment batch for video {video_id}: {str(batch_error)}")  # Debug log
                    logger.error(f"Error fetching comment batch for video {video_id}: {str(batch_error)}")
                    break
            
            logger.info(f"Successfully fetched {len(comments_data)} comments for video {video_id}")
            return True, f"Successfully fetched {len(comments_data)} comments", comments_data
            
        except Exception as e:
            error_msg = f"Failed to fetch comments for video {video_id}: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, []
    
    def _process_comment_item(self, item: Dict, video: Video) -> Optional[Dict]:
        """Process a single comment item from YouTube API response"""
        try:
            snippet = item['snippet']['topLevelComment']['snippet']
            
            # Extract comment data
            comment_data = {
                'id': item['id'],
                'author_name': snippet['authorDisplayName'],
                'author_channel_id': snippet.get('authorChannelId', {}).get('value'),
                'author_profile_picture': snippet.get('authorProfileImageUrl'),
                'text': snippet['textDisplay'],
                'like_count': snippet['likeCount'],
                'published_at': snippet['publishedAt'],
                'updated_at': snippet.get('updatedAt'),
                'video': video
            }
            
            # Handle replies if they exist
            if 'replies' in item:
                replies = item['replies']['comments']
                comment_data['replies_count'] = len(replies)
                
                # Process replies (optional - can be implemented later)
                # for reply in replies:
                #     reply_data = self._process_reply_item(reply, video)
                #     if reply_data:
                #         comment_data.setdefault('replies', []).append(reply_data)
            
            return comment_data
            
        except Exception as e:
            logger.error(f"Error processing comment item: {str(e)}")
            return None
    
    def store_comments(self, video_id: str, comments_data: List[Dict]) -> Tuple[bool, str, int]:
        """
        Store fetched comments in the database
        
        Args:
            video_id: YouTube video ID
            comments_data: List of comment data dictionaries
            
        Returns:
            Tuple of (success, message, comments_stored_count)
        """
        try:
            logger.info(f"Starting to store {len(comments_data)} comments for video {video_id}")
            
            # Get video object
            try:
                video = Video.objects.get(id=video_id)
            except Video.DoesNotExist:
                return False, "Video not found", 0
            
            stored_count = 0
            updated_count = 0
            
            for comment_data in comments_data:
                try:
                    # Check if comment already exists
                    comment, created = Comment.objects.get_or_create(
                        id=comment_data['id'],
                        defaults={
                            'video': video,
                            'author_name': comment_data['author_name'],
                            'author_channel_id': comment_data.get('author_channel_id'),
                            'author_profile_picture': comment_data.get('author_profile_picture'),
                            'text': comment_data['text'],
                            'like_count': comment_data['like_count'],
                            'published_at': self._parse_datetime(comment_data['published_at']),
                            'updated_at': self._parse_datetime(comment_data.get('updated_at')),
                        }
                    )
                    
                    if created:
                        stored_count += 1
                        logger.debug(f"Created new comment {comment.id} for video {video_id}")
                        
                        # Also store comment in MongoDB
                        try:
                            from ..services.mongo_service import MongoService
                            
                            mongo_comment_data = {
                                'youtube_id': comment_data['id'],
                                'django_user_id': self.user.id,
                                'video_youtube_id': video_id,
                                'author_name': comment_data['author_name'],
                                'author_channel_id': comment_data.get('author_channel_id'),
                                'author_profile_picture': comment_data.get('author_profile_picture'),
                                'text': comment_data['text'],
                                'like_count': comment_data['like_count'],
                                'published_at': self._parse_datetime(comment_data['published_at']),
                                'updated_at': self._parse_datetime(comment_data.get('updated_at')),
                                'created_at': timezone.now()
                            }
                            
                            print(f"🔍 Storing comment in MongoDB with user ID: {self.user.id}, video ID: {video_id}")
                            print(f"🔍 Comment data: {mongo_comment_data}")
                            
                            MongoService.create_or_update_comment(mongo_comment_data)
                            print(f"✅ Stored comment in MongoDB: {comment_data['id']}")
                            
                        except Exception as mongo_error:
                            print(f"❌ MongoDB comment storage FAILED: {str(mongo_error)}")
                            import traceback
                            traceback.print_exc()
                            # Continue without MongoDB storage - not critical
                        
                        # Perform AI analysis for new comments
                        try:
                            from .ai_service import AIService
                            ai_service = AIService()
                            
                            # Analyze comment in real-time
                            analysis_result = ai_service.analyze_comment_realtime(
                                comment.text, 
                                str(comment.id)
                            )
                            
                            if analysis_result.get('status') == 'completed':
                                # Store analysis results directly in the comment model
                                comment.sentiment_score = analysis_result.get('sentiment_score', 0.0)
                                comment.sentiment_label = analysis_result.get('sentiment_label', 'neutral')
                                comment.toxicity_score = analysis_result.get('toxicity_score', 0.0)
                                comment.toxicity_label = analysis_result.get('toxicity_label', 'not_toxic')
                                comment.is_analyzed = True
                                comment.analysis_date = timezone.now()
                                comment.save()
                                
                                # Also update MongoDB comment with analysis results
                                try:
                                    from ..services.mongo_service import MongoService
                                    
                                    mongo_analysis_data = {
                                        'youtube_id': comment_data['id'],
                                        'sentiment_score': analysis_result.get('sentiment_score', 0.0),
                                        'sentiment_label': analysis_result.get('sentiment_label', 'neutral'),
                                        'toxicity_score': analysis_result.get('toxicity_score', 0.0),
                                        'toxicity_label': analysis_result.get('toxicity_label', 'not_toxic'),
                                        'is_analyzed': True,
                                        'analysis_date': timezone.now()
                                    }
                                    
                                    MongoService.update_comment_analysis(comment_data['id'], mongo_analysis_data)
                                    print(f"✅ Updated MongoDB comment analysis: {comment_data['id']}")
                                    
                                except Exception as mongo_update_error:
                                    print(f"⚠️  Warning: MongoDB comment analysis update failed: {str(mongo_update_error)}")
                                
                                print(f"AI analysis completed for comment {comment.id}")  # Debug log
                            else:
                                print(f"AI analysis failed for comment {comment.id}: {analysis_result.get('error', 'Unknown error')}")  # Debug log
                                
                        except Exception as analysis_error:
                            print(f"Error during AI analysis for comment {comment.id}: {str(analysis_error)}")  # Debug log
                            logger.error(f"Error during AI analysis for comment {comment.id}: {str(analysis_error)}")
                    else:
                        # Update existing comment
                        comment.author_name = comment_data['author_name']
                        comment.author_channel_id = comment_data.get('author_channel_id')
                        comment.author_profile_picture = comment_data.get('author_profile_picture')
                        comment.text = comment_data['text']
                        comment.like_count = comment_data['like_count']
                        comment.updated_at = self._parse_datetime(comment_data.get('updated_at'))
                        comment.save()
                        updated_count += 1
                        logger.debug(f"Updated existing comment {comment.id} for video {video_id}")
                        
                except Exception as comment_error:
                    logger.error(f"Error storing comment {comment_data.get('id', 'unknown')}: {str(comment_error)}")
                    continue
            
            # Update video's comment fetching status
            video.comments_fetched = True
            video.last_comment_fetch = timezone.now()
            video.save()
            
            total_processed = stored_count + updated_count
            message = f"Successfully processed {total_processed} comments ({stored_count} new, {updated_count} updated)"
            
            logger.info(f"Comment storage completed for video {video_id}: {message}")
            return True, message, total_processed
            
        except Exception as e:
            error_msg = f"Failed to store comments for video {video_id}: {str(e)}"
            logger.error(error_msg)
            return False, error_msg, 0
    
    def _parse_datetime(self, datetime_str: str) -> Optional[timezone.datetime]:
        """Parse YouTube datetime string to Django timezone-aware datetime"""
        if not datetime_str:
            return None
            
        try:
            # YouTube uses ISO 8601 format with 'Z' suffix
            from datetime import datetime
            dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            # Check if datetime is already timezone-aware
            if dt.tzinfo is None:
                return timezone.make_aware(dt, timezone=timezone.utc)
            else:
                return dt
        except Exception as e:
            logger.warning(f"Failed to parse datetime '{datetime_str}': {str(e)}")
            return timezone.now()
    
    def get_video_comments(self, video_id: str, page: int = 1, per_page: int = 20) -> Dict:
        """
        Get paginated comments for a video
        
        Args:
            video_id: YouTube video ID
            page: Page number (1-based)
            per_page: Comments per page
            
        Returns:
            Dictionary with comments and pagination info
        """
        try:
            # Check if user has access to this video
            try:
                video = Video.objects.get(id=video_id)
                if video.channel.user != self.user:
                    return {
                        'success': False,
                        'error': 'Access denied to this video',
                        'comments': [],
                        'pagination': {}
                    }
            except Video.DoesNotExist:
                return {
                    'success': False,
                    'error': 'Video not found',
                    'comments': [],
                    'pagination': {}
                }
            
            # Calculate pagination
            offset = (page - 1) * per_page
            
            # Get comments with pagination
            comments = Comment.objects.filter(video=video).order_by('-published_at')
            total_comments = comments.count()
            
            # Apply pagination
            paginated_comments = comments[offset:offset + per_page]
            
            # Serialize comments
            from ..serializers import CommentSerializer
            serializer = CommentSerializer(paginated_comments, many=True)
            
            # Calculate pagination info
            total_pages = (total_comments + per_page - 1) // per_page
            has_next = page < total_pages
            has_prev = page > 1
            
            return {
                'success': True,
                'comments': serializer.data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total_comments,
                    'total_pages': total_pages,
                    'has_next': has_next,
                    'has_prev': has_prev
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting comments for video {video_id}: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to get comments: {str(e)}',
                'comments': [],
                'pagination': {}
            }
