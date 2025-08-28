from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Channel, Video, Comment, AnalysisResult, UserPreference


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom admin for User model"""
    list_display = ('username', 'email', 'google_email', 'is_active_channel', 'date_joined', 'is_active')
    list_filter = ('is_active', 'is_staff', 'date_joined', 'is_active_channel')
    search_fields = ('username', 'email', 'google_email', 'first_name', 'last_name')
    readonly_fields = ('date_joined', 'last_login')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'google_email', 'profile_picture')}),
        ('YouTube Integration', {'fields': ('youtube_access_token', 'youtube_refresh_token', 'token_expiry', 'is_active_channel')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


@admin.register(Channel)
class ChannelAdmin(admin.ModelAdmin):
    """Admin for Channel model"""
    list_display = ('title', 'user', 'subscriber_count', 'video_count', 'view_count', 'is_connected', 'last_sync')
    list_filter = ('is_connected', 'country', 'last_sync', 'created_at')
    search_fields = ('title', 'description', 'user__username', 'user__email')
    readonly_fields = ('id', 'created_at', 'last_sync')
    
    fieldsets = (
        ('Basic Info', {'fields': ('id', 'title', 'description', 'custom_url')}),
        ('Media', {'fields': ('thumbnail_url',)}),
        ('Statistics', {'fields': ('subscriber_count', 'video_count', 'view_count')}),
        ('Details', {'fields': ('country', 'published_at')}),
        ('Status', {'fields': ('is_connected', 'last_sync')}),
        ('Relations', {'fields': ('user',)}),
        ('Timestamps', {'fields': ('created_at',)}),
    )


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """Admin for Video model"""
    list_display = ('title', 'channel', 'view_count', 'like_count', 'comment_count', 'published_at', 'comments_analyzed')
    list_filter = ('comments_fetched', 'comments_analyzed', 'category_id', 'language', 'published_at', 'created_at')
    search_fields = ('title', 'description', 'channel__title', 'channel__user__username')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_comment_fetch', 'last_analysis')
    
    fieldsets = (
        ('Basic Info', {'fields': ('id', 'title', 'description')}),
        ('Media', {'fields': ('thumbnail_url', 'duration')}),
        ('Statistics', {'fields': ('view_count', 'like_count', 'comment_count')}),
        ('Details', {'fields': ('category_id', 'tags', 'language', 'published_at')}),
        ('Analysis Status', {'fields': ('comments_fetched', 'comments_analyzed', 'last_comment_fetch', 'last_analysis')}),
        ('Relations', {'fields': ('channel',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin for Comment model"""
    list_display = ('author_name', 'video', 'sentiment_label', 'toxicity_label', 'like_count', 'published_at', 'is_analyzed')
    list_filter = ('is_analyzed', 'sentiment_label', 'toxicity_label', 'published_at', 'created_at')
    search_fields = ('author_name', 'text', 'video__title', 'video__channel__title')
    readonly_fields = ('id', 'created_at', 'analysis_date')
    
    fieldsets = (
        ('Basic Info', {'fields': ('id', 'text', 'author_name')}),
        ('Author Details', {'fields': ('author_channel_id', 'author_profile_picture')}),
        ('Engagement', {'fields': ('like_count', 'published_at', 'updated_at')}),
        ('Analysis Results', {'fields': ('sentiment_score', 'sentiment_label', 'toxicity_score', 'toxicity_label', 'is_analyzed', 'analysis_date')}),
        ('Relations', {'fields': ('video',)}),
        ('Timestamps', {'fields': ('created_at',)}),
    )


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    """Admin for AnalysisResult model"""
    list_display = ('video', 'total_comments', 'analyzed_comments', 'engagement_score', 'analysis_date', 'ai_model_used')
    list_filter = ('analysis_date', 'ai_model_used')
    search_fields = ('video__title', 'video__channel__title', 'video__channel__user__username')
    readonly_fields = ('id', 'analysis_date', 'processing_time')
    
    fieldsets = (
        ('Basic Info', {'fields': ('id', 'video')}),
        ('Metrics', {'fields': ('total_comments', 'analyzed_comments')}),
        ('Sentiment Distribution', {'fields': ('positive_sentiment_ratio', 'negative_sentiment_ratio', 'neutral_sentiment_ratio')}),
        ('Toxicity', {'fields': ('average_toxicity_score',)}),
        ('Engagement', {'fields': ('top_commenters', 'engagement_score', 'comment_quality_score')}),
        ('AI Insights', {'fields': ('audience_insights', 'content_recommendations', 'engagement_trends')}),
        ('Technical', {'fields': ('processing_time', 'ai_model_used', 'analysis_date')}),
    )


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    """Admin for UserPreference model"""
    list_display = ('user', 'default_channel', 'videos_per_page', 'auto_refresh_enabled', 'include_toxicity_analysis')
    list_filter = ('auto_refresh_enabled', 'include_toxicity_analysis', 'save_analysis_history', 'email_notifications')
    search_fields = ('user__username', 'user__email', 'default_channel')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Display Preferences', {'fields': ('default_channel', 'videos_per_page', 'auto_refresh_enabled', 'refresh_interval')}),
        ('Analysis Preferences', {'fields': ('default_analysis_type', 'include_toxicity_analysis', 'save_analysis_history')}),
        ('Notifications', {'fields': ('email_notifications', 'analysis_complete_notifications')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


# Customize admin site
admin.site.site_header = "GetSentimate Admin"
admin.site.site_title = "GetSentimate Admin Portal"
admin.site.index_title = "Welcome to GetSentimate Administration"
