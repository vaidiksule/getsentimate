from typing import List, Dict, Optional, Any
from datetime import datetime
from mongoengine.errors import DoesNotExist, ValidationError
from ..mongo_models import (
    MongoUser, MongoChannel, MongoVideo, MongoComment, 
    MongoAnalysisResult, MongoUserPreference
)
import logging

logger = logging.getLogger(__name__)


class MongoService:
    """Service layer for MongoDB operations"""
    
    # User operations
    @staticmethod
    def create_or_update_user(django_user_id: int, user_data: Dict[str, Any]) -> MongoUser:
        """Create or update a MongoDB user"""
        try:
            # Try to get existing user
            try:
                user = MongoUser.objects.get(django_user_id=django_user_id)
                # Update existing user
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.updated_at = datetime.utcnow()
                user.save()
                return user
            except MongoUser.DoesNotExist:
                # Create new user
                user = MongoUser(**user_data)
                user.save()
                return user
        except Exception as e:
            logger.error(f"Error creating/updating user: {e}")
            raise
    
    @staticmethod
    def get_user_by_django_id(django_user_id: int) -> Optional[MongoUser]:
        """Get MongoDB user by Django user ID"""
        try:
            return MongoUser.objects.get(django_user_id=django_user_id)
        except DoesNotExist:
            return None
    
    @staticmethod
    def get_user_by_google_id(google_id: str) -> Optional[MongoUser]:
        """Get MongoDB user by Google ID"""
        try:
            return MongoUser.objects.get(google_id=google_id)
        except DoesNotExist:
            return None
    
    # Channel operations
    @staticmethod
    def create_or_update_channel(channel_data: Dict[str, Any]) -> MongoChannel:
        """Create or update a MongoDB channel"""
        try:
            # Try to get existing channel
            try:
                channel = MongoChannel.objects.get(
                    youtube_id=channel_data['youtube_id'],
                    django_user_id=channel_data['django_user_id']
                )
                # Update existing channel
                for key, value in channel_data.items():
                    setattr(channel, key, value)
                channel.last_sync = datetime.utcnow()
                channel.save()
                return channel
            except MongoChannel.DoesNotExist:
                # Create new channel
                channel = MongoChannel(**channel_data)
                channel.save()
                return channel
        except Exception as e:
            logger.error(f"Error creating/updating channel: {e}")
            raise
    
    @staticmethod
    def get_user_channels(django_user_id: int) -> List[MongoChannel]:
        """Get all channels for a user"""
        try:
            return list(MongoChannel.objects.filter(django_user_id=django_user_id))
        except Exception as e:
            logger.error(f"Error getting user channels: {e}")
            return []
    
    @staticmethod
    def get_channel_by_id(channel_id: str, django_user_id: int) -> Optional[MongoChannel]:
        """Get a specific channel by ID"""
        try:
            return MongoChannel.objects.get(
                youtube_id=channel_id,
                django_user_id=django_user_id
            )
        except DoesNotExist:
            return None
    
    # Video operations
    @staticmethod
    def create_or_update_video(video_data: Dict[str, Any]) -> MongoVideo:
        """Create or update a MongoDB video"""
        try:
            # Try to get existing video
            try:
                video = MongoVideo.objects.get(youtube_id=video_data['youtube_id'])
                # Update existing video
                for key, value in video_data.items():
                    setattr(video, key, value)
                video.updated_at = datetime.utcnow()
                video.save()
                return video
            except MongoVideo.DoesNotExist:
                # Create new video
                video = MongoVideo(**video_data)
                video.save()
                return video
        except Exception as e:
            logger.error(f"Error creating/updating video: {e}")
            raise
    
    @staticmethod
    def get_user_videos(django_user_id: int, limit: int = 50) -> List[MongoVideo]:
        """Get all videos for a user"""
        try:
            return list(MongoVideo.objects.filter(django_user_id=django_user_id).limit(limit))
        except Exception as e:
            logger.error(f"Error getting user videos: {e}")
            return []
    
    @staticmethod
    def get_channel_videos(channel_youtube_id: str, django_user_id: int) -> List[MongoVideo]:
        """Get all videos for a specific channel"""
        try:
            return list(MongoVideo.objects.filter(
                channel_youtube_id=channel_youtube_id,
                django_user_id=django_user_id
            ))
        except Exception as e:
            logger.error(f"Error getting channel videos: {e}")
            return []
    
    @staticmethod
    def get_video_by_id(video_id: str, django_user_id: int) -> Optional[MongoVideo]:
        """Get a specific video by ID"""
        try:
            return MongoVideo.objects.get(
                youtube_id=video_id,
                django_user_id=django_user_id
            )
        except DoesNotExist:
            return None
    
    # Comment operations
    @staticmethod
    def create_or_update_comment(comment_data: Dict[str, Any]) -> MongoComment:
        """Create or update a MongoDB comment"""
        try:
            # Try to get existing comment
            try:
                comment = MongoComment.objects.get(youtube_id=comment_data['youtube_id'])
                # Update existing comment
                for key, value in comment_data.items():
                    setattr(comment, key, value)
                comment.save()
                return comment
            except MongoComment.DoesNotExist:
                # Create new comment
                comment = MongoComment(**comment_data)
                comment.save()
                return comment
        except Exception as e:
            logger.error(f"Error creating/updating comment: {e}")
            raise
    
    @staticmethod
    def get_video_comments(video_youtube_id: str, django_user_id: int) -> List[MongoComment]:
        """Get all comments for a video"""
        try:
            return list(MongoComment.objects.filter(
                video_youtube_id=video_youtube_id,
                django_user_id=django_user_id
            ))
        except Exception as e:
            logger.error(f"Error getting video comments: {e}")
            return []
    
    @staticmethod
    def update_comment_analysis(comment_youtube_id: str, analysis_data: Dict[str, Any]) -> bool:
        """Update comment with analysis results"""
        try:
            comment = MongoComment.objects.get(youtube_id=comment_youtube_id)
            for key, value in analysis_data.items():
                setattr(comment, key, value)
            comment.analysis_date = datetime.utcnow()
            comment.save()
            return True
        except Exception as e:
            logger.error(f"Error updating comment analysis: {e}")
            return False
    
    # Analysis operations
    @staticmethod
    def create_or_update_analysis(analysis_data: Dict[str, Any]) -> MongoAnalysisResult:
        """Create or update analysis results"""
        try:
            # Try to get existing analysis
            try:
                analysis = MongoAnalysisResult.objects.get(
                    video_youtube_id=analysis_data['video_youtube_id']
                )
                # Update existing analysis
                for key, value in analysis_data.items():
                    setattr(analysis, key, value)
                analysis.analysis_date = datetime.utcnow()
                analysis.save()
                return analysis
            except MongoAnalysisResult.DoesNotExist:
                # Create new analysis
                analysis = MongoAnalysisResult(**analysis_data)
                analysis.save()
                return analysis
        except Exception as e:
            logger.error(f"Error creating/updating analysis: {e}")
            raise
    
    @staticmethod
    def get_video_analysis(video_youtube_id: str, django_user_id: int) -> Optional[MongoAnalysisResult]:
        """Get analysis results for a video"""
        try:
            return MongoAnalysisResult.objects.get(
                video_youtube_id=video_youtube_id,
                django_user_id=django_user_id
            )
        except DoesNotExist:
            return None
    
    # User preferences operations
    @staticmethod
    def create_or_update_user_preferences(django_user_id: int, preferences_data: Dict[str, Any]) -> MongoUserPreference:
        """Create or update user preferences"""
        try:
            # Try to get existing preferences
            try:
                prefs = MongoUserPreference.objects.get(django_user_id=django_user_id)
                # Update existing preferences
                for key, value in preferences_data.items():
                    setattr(prefs, key, value)
                prefs.updated_at = datetime.utcnow()
                prefs.save()
                return prefs
            except MongoUserPreference.DoesNotExist:
                # Create new preferences
                prefs = MongoUserPreference(**preferences_data)
                prefs.save()
                return prefs
        except Exception as e:
            logger.error(f"Error creating/updating user preferences: {e}")
            raise
    
    @staticmethod
    def get_user_preferences(django_user_id: int) -> Optional[MongoUserPreference]:
        """Get user preferences"""
        try:
            return MongoUserPreference.objects.get(django_user_id=django_user_id)
        except DoesNotExist:
            return None
    
    # Utility methods
    @staticmethod
    def delete_user_data(django_user_id: int) -> bool:
        """Delete all data for a user (for GDPR compliance)"""
        try:
            MongoUser.objects.filter(django_user_id=django_user_id).delete()
            MongoChannel.objects.filter(django_user_id=django_user_id).delete()
            MongoVideo.objects.filter(django_user_id=django_user_id).delete()
            MongoComment.objects.filter(django_user_id=django_user_id).delete()
            MongoAnalysisResult.objects.filter(django_user_id=django_user_id).delete()
            MongoUserPreference.objects.filter(django_user_id=django_user_id).delete()
            return True
        except Exception as e:
            logger.error(f"Error deleting user data: {e}")
            return False
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get database statistics"""
        try:
            return {
                'users': MongoUser.objects.count(),
                'channels': MongoChannel.objects.count(),
                'videos': MongoVideo.objects.count(),
                'comments': MongoComment.objects.count(),
                'analyses': MongoAnalysisResult.objects.count(),
                'preferences': MongoUserPreference.objects.count(),
            }
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {}
    
    @staticmethod
    def get_user_dashboard_stats(django_user_id: int) -> Dict[str, Any]:
        """Get dashboard statistics for a specific user"""
        try:
            print(f"🔍 Getting dashboard stats for Django user ID: {django_user_id}")
            
            # Get user's videos
            videos = MongoVideo.objects.filter(django_user_id=django_user_id)
            total_videos = videos.count()
            print(f"📹 Found {total_videos} videos for user {django_user_id}")
            
            # Get user's comments
            comments = MongoComment.objects.filter(django_user_id=django_user_id)
            total_comments = comments.count()
            print(f"💬 Found {total_comments} comments for user {django_user_id}")
            
            # Calculate average sentiment from analyzed comments
            print(f"🔍 Calculating sentiment for {total_comments} comments...")
            
            # Get comments with sentiment scores
            analyzed_comments = []
            for comment in comments:
                if hasattr(comment, 'sentiment_score') and comment.sentiment_score is not None:
                    analyzed_comments.append(comment)
                    print(f"   Comment {comment.youtube_id}: sentiment_score = {comment.sentiment_score}")
            
            print(f"🔍 Found {len(analyzed_comments)} comments with sentiment scores")
            
            if analyzed_comments:
                sentiment_scores = [c.sentiment_score for c in analyzed_comments]
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                print(f"🔍 Sentiment scores: {sentiment_scores}")
                print(f"🔍 Average sentiment: {avg_sentiment}")
            else:
                avg_sentiment = 0.0
                print(f"⚠️  No comments with sentiment scores found")
            
            # Get recent activity
            recent_activity = []
            
            # Recent videos
            recent_videos = videos.order_by('-created_at').limit(3)
            for video in recent_videos:
                recent_activity.append({
                    'type': 'video',
                    'message': f'Added video: "{video.title}"',
                    'timestamp': video.created_at
                })
            
            # Recent comments
            recent_comments = comments.order_by('-published_at').limit(3)
            for comment in recent_comments:
                recent_activity.append({
                    'type': 'comments',
                    'message': f'Fetched comments for video',
                    'timestamp': comment.published_at
                })
            
            # Recent analyses
            analyses = MongoAnalysisResult.objects.filter(django_user_id=django_user_id).order_by('-analysis_date').limit(3)
            for analysis in analyses:
                recent_activity.append({
                    'type': 'analysis',
                    'message': f'Analysis completed for video',
                    'timestamp': analysis.analysis_date
                })
            
            # Sort by timestamp and take top 5
            recent_activity.sort(key=lambda x: x['timestamp'], reverse=True)
            recent_activity = recent_activity[:5]
            
            return {
                'total_videos': total_videos,
                'total_comments': total_comments,
                'avg_sentiment': round(avg_sentiment, 2),
                'recent_activity': recent_activity
            }
            
        except Exception as e:
            logger.error(f"Error getting user dashboard stats: {e}")
            return {
                'total_videos': 0,
                'total_comments': 0,
                'avg_sentiment': 0.0,
                'recent_activity': []
            }
