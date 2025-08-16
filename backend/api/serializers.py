# backend/api/serializers.py

from rest_framework import serializers
from .services.mongodb_service import MongoDBService

class VideoSerializer(serializers.Serializer):
    video_id = serializers.CharField()
    title = serializers.CharField()
    channel_id = serializers.CharField()
    channel_title = serializers.CharField()
    published_at = serializers.DateTimeField()
    view_count = serializers.IntegerField()
    like_count = serializers.IntegerField()
    comment_count = serializers.IntegerField()
    comments_analyzed = serializers.IntegerField()
    last_analyzed = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def create(self, validated_data):
        # This method is not needed if you're not using Django's model
        # and are directly inserting into MongoDB.
        return None

    def update(self, instance, validated_data):
        # This method is not needed if you're not using Django's model
        # and are directly inserting into MongoDB.
        return None

    def to_representation(self, instance):
        # This method is crucial for converting MongoDB data to a format
        # suitable for the API response.
        return {
            'video_id': instance['video_id'],
            'title': instance['title'],
            'channel_id': instance['channel_id'],
            'channel_title': instance['channel_title'],
            'published_at': instance['published_at'],
            'view_count': instance['view_count'],
            'like_count': instance['like_count'],
            'comment_count': instance['comment_count'],
            'comments_analyzed': instance['comments_analyzed'],
            'last_analyzed': instance['last_analyzed'],
            'created_at': instance['created_at'],
            'updated_at': instance['updated_at'],
        }

class CommentSerializer(serializers.Serializer):
    comment_id = serializers.CharField()
    video_id = serializers.CharField()
    channel_id = serializers.CharField()
    author_name = serializers.CharField()
    author_channel_url = serializers.URLField(allow_blank=True)
    text = serializers.CharField()
    like_count = serializers.IntegerField()
    published_at = serializers.DateTimeField()
    sentiment_score = serializers.FloatField(allow_null=True)
    sentiment_label = serializers.CharField(allow_blank=True)
    toxicity_score = serializers.FloatField(allow_null=True)
    toxicity_label = serializers.CharField(allow_blank=True)
    summary = serializers.CharField(allow_blank=True)
    key_topics = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    suggestions = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    pain_points = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    analyzed = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def create(self, validated_data):
        # This method is not needed if you're not using Django's model
        # and are directly inserting into MongoDB.
        return None

    def update(self, instance, validated_data):
        # This method is not needed if you're not using Django's model
        # and are directly inserting into MongoDB.
        return None

    def to_representation(self, instance):
        return {
            'comment_id': instance['comment_id'],
            'video_id': instance['video_id'],
            'channel_id': instance['channel_id'],
            'author_name': instance['author_name'],
            'author_channel_url': instance['author_channel_url'],
            'text': instance['text'],
            'like_count': instance['like_count'],
            'published_at': instance['published_at'],
            'sentiment_score': instance['sentiment_score'],
            'sentiment_label': instance['sentiment_label'],
            'toxicity_score': instance['toxicity_score'],
            'toxicity_label': instance['toxicity_label'],
            'summary': instance['summary'],
            'key_topics': instance['key_topics'],
            'suggestions': instance['suggestions'],
            'pain_points': instance['pain_points'],
            'analyzed': instance['analyzed'],
            'created_at': instance['created_at'],
            'updated_at': instance['updated_at'],
        }

class AnalysisSessionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    video = VideoSerializer()  # Use VideoSerializer for video data
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    total_comments = serializers.IntegerField()
    analyzed_comments = serializers.IntegerField()

    def to_representation(self, instance):
        # Crucial: Convert ObjectId to string
        video_data = instance.get('video')
        if video_data:
            video_serializer = VideoSerializer(video_data)
            video_representation = video_serializer.data
        else:
            video_representation = None

        return {
            'id': instance.get('id'),
            'video': video_representation,
            'started_at': instance.get('started_at'),
            'completed_at': instance.get('completed_at'),
            'status': instance.get('status'),
            'total_comments': instance.get('total_comments'),
            'analyzed_comments': instance.get('analyzed_comments'),
        }

class VideoAnalyticsSerializer(serializers.Serializer):
    video_id = serializers.CharField()
    total_comments = serializers.IntegerField()
    analyzed_comments = serializers.IntegerField()
    sentiment_distribution = serializers.DictField()
    toxicity_distribution = serializers.DictField()
    analysis_progress = serializers.FloatField()

    def to_representation(self, instance):
        return {
            'video_id': instance.get('video_id'),
            'total_comments': instance.get('total_comments'),
            'analyzed_comments': instance.get('analyzed_comments'),
            'sentiment_distribution': instance.get('sentiment_distribution'),
            'toxicity_distribution': instance.get('toxicity_distribution'),
            'analysis_progress': instance.get('analysis_progress'),
        }

# class CommentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Comment
#         fields = [
#             'id', 'comment_id', 'video_id', 'channel_id', 'author_name',
#             'author_channel_url', 'text', 'like_count', 'published_at',
#             'sentiment_score', 'sentiment_label', 'toxicity_score', 'toxicity_label',
#             'summary', 'key_topics', 'suggestions', 'pain_points',
#             'created_at', 'updated_at', 'analyzed'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']


# class VideoSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Video
#         fields = [
#             'id', 'video_id', 'title', 'channel_id', 'channel_title',
#             'published_at', 'view_count', 'like_count', 'comment_count',
#             'comments_analyzed', 'last_analyzed', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at']


# class AnalysisSessionSerializer(serializers.ModelSerializer):
#     video = VideoSerializer(read_only=True)
    
#     class Meta:
#         model = AnalysisSession
#         fields = [
#             'id', 'video', 'started_at', 'completed_at', 'status',
#             'total_comments', 'analyzed_comments'
#         ]
#         read_only_fields = ['id', 'started_at']


# class VideoAnalyticsSerializer(serializers.Serializer):
#     video_id = serializers.CharField()
#     total_comments = serializers.IntegerField()
#     analyzed_comments = serializers.IntegerField()
#     sentiment_distribution = serializers.DictField()
#     toxicity_distribution = serializers.DictField()
#     analysis_progress = serializers.FloatField()
