from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Extended user model with YouTube OAuth and preferences"""
    google_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    google_email = models.EmailField(unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    youtube_access_token = models.TextField(null=True, blank=True)
    youtube_refresh_token = models.TextField(null=True, blank=True)
    token_expiry = models.DateTimeField(null=True, blank=True)
    is_active_channel = models.CharField(max_length=100, null=True, blank=True)  # Current active channel ID
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.google_email})"


class Channel(models.Model):
    """YouTube channel information"""
    id = models.CharField(max_length=100, primary_key=True)  # YouTube channel ID
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channels')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    custom_url = models.CharField(max_length=100, blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    subscriber_count = models.IntegerField(default=0)
    video_count = models.IntegerField(default=0)
    view_count = models.BigIntegerField(default=0)
    country = models.CharField(max_length=10, blank=True, null=True)
    published_at = models.DateTimeField(null=True, blank=True)
    is_connected = models.BooleanField(default=True)
    last_sync = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'channels'
        unique_together = ['id', 'user']

    def __str__(self):
        return f"{self.title} ({self.user.username})"


class Video(models.Model):
    """YouTube video information"""
    id = models.CharField(max_length=20, primary_key=True)  # YouTube video ID
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    published_at = models.DateTimeField()
    duration = models.CharField(max_length=20, blank=True, null=True)  # ISO 8601 duration
    view_count = models.BigIntegerField(default=0)
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    category_id = models.CharField(max_length=20, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    language = models.CharField(max_length=10, blank=True, null=True)
    
    # Analysis flags
    comments_fetched = models.BooleanField(default=False)
    comments_analyzed = models.BooleanField(default=False)
    last_comment_fetch = models.DateTimeField(null=True, blank=True)
    last_analysis = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'videos'
        ordering = ['-published_at']

    def __str__(self):
        return f"{self.title} ({self.channel.title})"


class Comment(models.Model):
    """YouTube video comment"""
    id = models.CharField(max_length=100, primary_key=True)  # YouTube comment ID
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    author_name = models.CharField(max_length=200)
    author_channel_id = models.CharField(max_length=100, blank=True, null=True)
    author_profile_picture = models.URLField(max_length=500, blank=True, null=True)
    text = models.TextField()
    like_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()
    updated_at = models.DateTimeField(null=True, blank=True)
    
    # Analysis results
    sentiment_score = models.FloatField(null=True, blank=True)
    sentiment_label = models.CharField(max_length=20, blank=True, null=True)
    toxicity_score = models.FloatField(null=True, blank=True)
    toxicity_label = models.CharField(max_length=20, blank=True, null=True)
    is_analyzed = models.BooleanField(default=False)
    analysis_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
        ordering = ['-published_at']

    def __str__(self):
        return f"{self.author_name}: {self.text[:50]}..."


class AnalysisResult(models.Model):
    """Results of video analysis"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video = models.OneToOneField(Video, on_delete=models.CASCADE, related_name='analysis')
    
    # Overall metrics
    total_comments = models.IntegerField(default=0)
    analyzed_comments = models.IntegerField(default=0)
    positive_sentiment_ratio = models.FloatField(default=0.0)
    negative_sentiment_ratio = models.FloatField(default=0.0)
    neutral_sentiment_ratio = models.FloatField(default=0.0)
    average_toxicity_score = models.FloatField(default=0.0)
    
    # Engagement insights
    top_commenters = models.JSONField(default=list, blank=True)
    engagement_score = models.FloatField(default=0.0)
    comment_quality_score = models.FloatField(default=0.0)
    
    # AI-generated insights
    audience_insights = models.TextField(blank=True, null=True)
    content_recommendations = models.TextField(blank=True, null=True)
    engagement_trends = models.TextField(blank=True, null=True)
    
    # Metadata
    analysis_date = models.DateTimeField(auto_now_add=True)
    processing_time = models.FloatField(default=0.0)  # seconds
    ai_model_used = models.CharField(max_length=50, default='gemini-1.5-pro')

    class Meta:
        db_table = 'analysis_results'

    def __str__(self):
        return f"Analysis for {self.video.title}"


class UserPreference(models.Model):
    """User preferences and settings"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    
    # Display preferences
    default_channel = models.CharField(max_length=100, blank=True, null=True)
    videos_per_page = models.IntegerField(default=10)
    auto_refresh_enabled = models.BooleanField(default=True)
    refresh_interval = models.IntegerField(default=300)  # seconds
    
    # Analysis preferences
    default_analysis_type = models.CharField(max_length=50, default='sentiment')
    include_toxicity_analysis = models.BooleanField(default=True)
    save_analysis_history = models.BooleanField(default=True)
    
    # Notification preferences
    email_notifications = models.BooleanField(default=False)
    analysis_complete_notifications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f"Preferences for {self.user.username}"
