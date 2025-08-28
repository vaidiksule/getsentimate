from rest_framework import serializers
from .models import User, Channel, Video, Comment, AnalysisResult, UserPreference


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses"""
    channels_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'google_email', 'profile_picture',
            'is_active_channel', 'channels_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_channels_count(self, obj):
        return obj.channels.count()


class ChannelSerializer(serializers.ModelSerializer):
    """Channel serializer for API responses"""
    videos_count = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Channel
        fields = [
            'id', 'title', 'description', 'custom_url', 'thumbnail_url',
            'subscriber_count', 'video_count', 'view_count', 'country',
            'published_at', 'is_connected', 'last_sync', 'videos_count',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'last_sync']
    
    def get_videos_count(self, obj):
        return obj.videos.count()
    
    def get_is_active(self, obj):
        return obj.user.is_active_channel == obj.id


class VideoSerializer(serializers.ModelSerializer):
    """Video serializer for API responses"""
    channel = ChannelSerializer(read_only=True)
    comments_analyzed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Video
        fields = [
            'id', 'title', 'description', 'thumbnail_url', 'published_at',
            'duration', 'view_count', 'like_count', 'comment_count',
            'category_id', 'tags', 'language', 'comments_fetched',
            'comments_analyzed', 'last_comment_fetch', 'last_analysis',
            'channel', 'comments_analyzed_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'last_comment_fetch', 'last_analysis']
    
    def get_comments_analyzed_count(self, obj):
        return obj.comments.filter(is_analyzed=True).count()


class CommentSerializer(serializers.ModelSerializer):
    """Comment serializer for API responses"""
    video_title = serializers.CharField(source='video.title', read_only=True)
    video_id = serializers.CharField(source='video.id', read_only=True)
    channel_title = serializers.CharField(source='video.channel.title', read_only=True)
    
    # Analysis results
    analysis = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'author_name', 'author_channel_id', 'author_profile_picture',
            'text', 'like_count', 'published_at', 'updated_at',
            'sentiment_score', 'sentiment_label', 'toxicity_score',
            'toxicity_label', 'is_analyzed', 'analysis_date',
            'video_title', 'video_id', 'channel_title', 'created_at',
            'analysis'
        ]
        read_only_fields = ['id', 'created_at', 'analysis_date']
    
    def get_analysis(self, obj):
        """Get analysis results for this comment"""
        if not obj.is_analyzed:
            return None
        
        # Return analysis results stored directly in the comment model
        return {
            'sentiment_score': obj.sentiment_score,
            'sentiment_label': obj.sentiment_label,
            'toxicity_score': obj.toxicity_score,
            'toxicity_label': obj.toxicity_label,
            'is_analyzed': obj.is_analyzed,
            'analysis_date': obj.analysis_date
        }


class AnalysisResultSerializer(serializers.ModelSerializer):
    """Analysis result serializer for API responses"""
    video_title = serializers.CharField(source='video.title', read_only=True)
    channel_title = serializers.CharField(source='video.channel.title', read_only=True)
    
    class Meta:
        model = AnalysisResult
        fields = [
            'id', 'total_comments', 'analyzed_comments',
            'positive_sentiment_ratio', 'negative_sentiment_ratio',
            'neutral_sentiment_ratio', 'average_toxicity_score',
            'top_commenters', 'engagement_score', 'comment_quality_score',
            'audience_insights', 'content_recommendations',
            'engagement_trends', 'analysis_date', 'processing_time',
            'ai_model_used', 'video_title', 'channel_title'
        ]
        read_only_fields = ['id', 'analysis_date']


class UserPreferenceSerializer(serializers.ModelSerializer):
    """User preference serializer for API responses"""
    class Meta:
        model = UserPreference
        fields = [
            'default_channel', 'videos_per_page', 'auto_refresh_enabled',
            'refresh_interval', 'default_analysis_type',
            'include_toxicity_analysis', 'save_analysis_history',
            'email_notifications', 'analysis_complete_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


# Detailed serializers for specific use cases
class VideoDetailSerializer(VideoSerializer):
    """Detailed video serializer with channel and analysis info"""
    channel = ChannelSerializer(read_only=True)
    analysis = AnalysisResultSerializer(read_only=True)
    
    class Meta(VideoSerializer.Meta):
        fields = VideoSerializer.Meta.fields + ['channel', 'analysis']


class ChannelDetailSerializer(ChannelSerializer):
    """Detailed channel serializer with recent videos"""
    recent_videos = serializers.SerializerMethodField()
    
    class Meta(ChannelSerializer.Meta):
        fields = ChannelSerializer.Meta.fields + ['recent_videos']
    
    def get_recent_videos(self, obj):
        videos = obj.videos.all()[:5]  # Get 5 most recent videos
        return VideoSerializer(videos, many=True).data


class CommentAnalysisSerializer(serializers.Serializer):
    """Serializer for comment analysis requests"""
    video_id = serializers.CharField(max_length=20)
    include_toxicity = serializers.BooleanField(default=True)
    analysis_type = serializers.ChoiceField(
        choices=['sentiment', 'toxicity', 'both'],
        default='both'
    )


class ChannelConnectionSerializer(serializers.Serializer):
    """Serializer for channel connection requests"""
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    expires_in = serializers.IntegerField()
