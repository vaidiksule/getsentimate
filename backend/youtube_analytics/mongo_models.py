from mongoengine import Document, StringField, IntField, FloatField, DateTimeField, BooleanField, ListField, ReferenceField, URLField, DictField
from datetime import datetime
import uuid


class MongoUser(Document):
    """MongoDB user model - extends Django User with additional fields"""
    django_user_id = IntField(required=True, unique=True)  # Link to Django User
    google_id = StringField(max_length=100, unique=True, sparse=True)
    google_email = StringField(max_length=255, unique=True, sparse=True)
    profile_picture = URLField(max_length=500)
    youtube_access_token = StringField()
    youtube_refresh_token = StringField()
    token_expiry = DateTimeField()
    is_active_channel = StringField(max_length=100)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',
        'indexes': [
            'django_user_id',
            'google_id',
            'google_email'
        ]
    }

    def __str__(self):
        return f"MongoUser({self.django_user_id})"


class MongoChannel(Document):
    """MongoDB channel model"""
    youtube_id = StringField(max_length=100, required=True, unique=True)
    django_user_id = IntField(required=True)  # Link to Django User
    title = StringField(max_length=200, required=True)
    description = StringField()
    custom_url = StringField(max_length=100)
    thumbnail_url = URLField(max_length=500)
    subscriber_count = IntField(default=0)
    video_count = IntField(default=0)
    view_count = IntField(default=0)
    country = StringField(max_length=10)
    published_at = DateTimeField()
    is_connected = BooleanField(default=True)
    last_sync = DateTimeField(default=datetime.utcnow)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'channels',
        'indexes': [
            'youtube_id',
            'django_user_id',
            ('youtube_id', 'django_user_id')
        ]
    }

    def __str__(self):
        return f"Channel({self.title})"


class MongoVideo(Document):
    """MongoDB video model"""
    youtube_id = StringField(max_length=20, required=True, unique=True)
    channel_youtube_id = StringField(max_length=100, required=True)  # Link to channel
    django_user_id = IntField(required=True)  # Link to Django User
    title = StringField(max_length=200, required=True)
    description = StringField()
    thumbnail_url = URLField(max_length=500)
    published_at = DateTimeField(required=True)
    duration = StringField(max_length=20)  # ISO 8601 duration
    view_count = IntField(default=0)
    like_count = IntField(default=0)
    comment_count = IntField(default=0)
    category_id = StringField(max_length=20)
    tags = ListField(StringField(), default=list)
    language = StringField(max_length=10)
    
    # Analysis flags
    comments_fetched = BooleanField(default=False)
    comments_analyzed = BooleanField(default=False)
    last_comment_fetch = DateTimeField()
    last_analysis = DateTimeField()
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'videos',
        'indexes': [
            'youtube_id',
            'channel_youtube_id',
            'django_user_id',
            'published_at'
        ],
        'ordering': ['-published_at']
    }

    def __str__(self):
        return f"Video({self.title})"


class MongoComment(Document):
    """MongoDB comment model"""
    youtube_id = StringField(max_length=100, required=True, unique=True)
    video_youtube_id = StringField(max_length=20, required=True)  # Link to video
    django_user_id = IntField(required=True)  # Link to Django User
    author_name = StringField(max_length=200, required=True)
    author_channel_id = StringField(max_length=100)
    author_profile_picture = URLField(max_length=500)
    text = StringField(required=True)
    like_count = IntField(default=0)
    published_at = DateTimeField(required=True)
    updated_at = DateTimeField()
    
    # Analysis results
    sentiment_score = FloatField()
    sentiment_label = StringField(max_length=20)
    toxicity_score = FloatField()
    toxicity_label = StringField(max_length=20)
    is_analyzed = BooleanField(default=False)
    analysis_date = DateTimeField()
    
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'comments',
        'indexes': [
            'youtube_id',
            'video_youtube_id',
            'django_user_id',
            'published_at',
            'is_analyzed'
        ],
        'ordering': ['-published_at']
    }

    def __str__(self):
        return f"Comment({self.author_name}: {self.text[:50]}...)"


class MongoAnalysisResult(Document):
    """MongoDB analysis result model"""
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    video_youtube_id = StringField(max_length=20, required=True, unique=True)
    django_user_id = IntField(required=True)  # Link to Django User
    
    # Overall metrics
    total_comments = IntField(default=0)
    analyzed_comments = IntField(default=0)
    positive_sentiment_ratio = FloatField(default=0.0)
    negative_sentiment_ratio = FloatField(default=0.0)
    neutral_sentiment_ratio = FloatField(default=0.0)
    average_toxicity_score = FloatField(default=0.0)
    
    # Engagement insights
    top_commenters = ListField(DictField(), default=list)
    engagement_score = FloatField(default=0.0)
    comment_quality_score = FloatField(default=0.0)
    
    # AI-generated insights
    audience_insights = StringField()
    content_recommendations = StringField()
    engagement_trends = StringField()
    
    # Metadata
    analysis_date = DateTimeField(default=datetime.utcnow)
    processing_time = FloatField(default=0.0)  # seconds
    ai_model_used = StringField(max_length=50, default='gemini-1.5-pro')

    meta = {
        'collection': 'analysis_results',
        'indexes': [
            'video_youtube_id',
            'django_user_id'
        ]
    }

    def __str__(self):
        return f"AnalysisResult({self.video_youtube_id})"


class MongoUserPreference(Document):
    """MongoDB user preference model"""
    django_user_id = IntField(required=True, unique=True)  # Link to Django User
    
    # Display preferences
    default_channel = StringField(max_length=100)
    videos_per_page = IntField(default=10)
    auto_refresh_enabled = BooleanField(default=True)
    refresh_interval = IntField(default=300)  # seconds
    
    # Analysis preferences
    default_analysis_type = StringField(max_length=50, default='sentiment')
    include_toxicity_analysis = BooleanField(default=True)
    save_analysis_history = BooleanField(default=True)
    
    # Notification preferences
    email_notifications = BooleanField(default=False)
    analysis_complete_notifications = BooleanField(default=True)
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'user_preferences',
        'indexes': [
            'django_user_id'
        ]
    }

    def __str__(self):
        return f"UserPreference({self.django_user_id})"
