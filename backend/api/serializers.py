from rest_framework import serializers
from .models import Comment, Video, AnalysisSession


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            'id', 'comment_id', 'video_id', 'channel_id', 'author_name',
            'author_channel_url', 'text', 'like_count', 'published_at',
            'sentiment_score', 'sentiment_label', 'toxicity_score', 'toxicity_label',
            'summary', 'key_topics', 'suggestions', 'pain_points',
            'created_at', 'updated_at', 'analyzed'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = [
            'id', 'video_id', 'title', 'channel_id', 'channel_title',
            'published_at', 'view_count', 'like_count', 'comment_count',
            'comments_analyzed', 'last_analyzed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalysisSessionSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    
    class Meta:
        model = AnalysisSession
        fields = [
            'id', 'video', 'started_at', 'completed_at', 'status',
            'total_comments', 'analyzed_comments'
        ]
        read_only_fields = ['id', 'started_at']


class VideoAnalyticsSerializer(serializers.Serializer):
    video_id = serializers.CharField()
    total_comments = serializers.IntegerField()
    analyzed_comments = serializers.IntegerField()
    sentiment_distribution = serializers.DictField()
    toxicity_distribution = serializers.DictField()
    analysis_progress = serializers.FloatField()
