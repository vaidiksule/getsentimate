from django.db import models
from django.contrib.auth.models import User


class Comment(models.Model):
    """YouTube comment model for analysis"""

    # YouTube comment data
    comment_id = models.CharField(max_length=255, unique=True)
    video_id = models.CharField(max_length=255)
    channel_id = models.CharField(max_length=255)
    author_name = models.CharField(max_length=255)
    author_channel_url = models.URLField(blank=True, null=True)
    text = models.TextField()
    like_count = models.IntegerField(default=0)
    published_at = models.DateTimeField()

    # Analysis results
    sentiment_score = models.FloatField(null=True, blank=True)
    sentiment_label = models.CharField(max_length=50, blank=True)  # positive, negative, neutral
    toxicity_score = models.FloatField(null=True, blank=True)
    toxicity_label = models.CharField(max_length=50, blank=True)  # toxic, non-toxic

    # AI analysis
    summary = models.TextField(blank=True)
    key_topics = models.JSONField(default=list, blank=True)
    suggestions = models.JSONField(default=list, blank=True)
    pain_points = models.JSONField(default=list, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    analyzed = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['video_id']),
            models.Index(fields=['sentiment_label']),
            models.Index(fields=['toxicity_label']),
            models.Index(fields=['published_at']),
        ]

    def __str__(self):
        return f"{self.author_name}: {self.text[:50]}..."


class Video(models.Model):
    """YouTube video model"""

    video_id = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=500)
    channel_id = models.CharField(max_length=255)
    channel_title = models.CharField(max_length=255)
    published_at = models.DateTimeField()
    view_count = models.IntegerField(default=0)
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)

    # Analysis metadata
    comments_analyzed = models.IntegerField(default=0)
    last_analyzed = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class AnalysisSession(models.Model):
    """Track analysis sessions for videos"""

    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='pending')  # pending, running, completed, failed
    total_comments = models.IntegerField(default=0)
    analyzed_comments = models.IntegerField(default=0)

    def __str__(self):
        return f"Analysis for {self.video.title} - {self.status}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    google_id = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
