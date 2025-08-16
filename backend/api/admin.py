# from django.contrib import admin
# from django.contrib.auth.admin import UserAdmin
# from django.contrib.auth import get_user_model
# # from .models import Comment, Video, AnalysisSession, UserProfile

# class UserProfileInline(admin.StackedInline):
#     model = UserProfile
#     can_delete = False
#     verbose_name_plural = 'Profile'

# class CustomUserAdmin(UserAdmin):
#     inlines = (UserProfileInline,)

# admin.site.unregister(get_user_model())
# admin.site.register(get_user_model(), CustomUserAdmin)

# @admin.register(Comment)
# class CommentAdmin(admin.ModelAdmin):
#     list_display = ['author_name', 'video_id', 'sentiment_label', 'toxicity_label', 'like_count', 'published_at']
#     list_filter = ['sentiment_label', 'toxicity_label', 'analyzed', 'published_at']
#     search_fields = ['author_name', 'text', 'video_id']
#     readonly_fields = ['created_at', 'updated_at']

#     fieldsets = (
#         ('YouTube Data', {
#             'fields': ('comment_id', 'video_id', 'channel_id', 'author_name', 'author_channel_url', 'text', 'like_count', 'published_at')
#         }),
#         ('Analysis Results', {
#             'fields': ('sentiment_score', 'sentiment_label', 'toxicity_score', 'toxicity_label', 'summary', 'key_topics', 'suggestions', 'pain_points')
#         }),
#         ('Metadata', {
#             'fields': ('analyzed', 'created_at', 'updated_at')
#         }),
#     )


# @admin.register(Video)
# class VideoAdmin(admin.ModelAdmin):
#     list_display = ['title', 'video_id', 'channel_title', 'view_count', 'comment_count', 'comments_analyzed']
#     list_filter = ['published_at', 'last_analyzed']
#     search_fields = ['title', 'video_id', 'channel_title']
#     readonly_fields = ['created_at', 'updated_at']


# @admin.register(AnalysisSession)
# class AnalysisSessionAdmin(admin.ModelAdmin):
#     list_display = ['video', 'status', 'total_comments', 'analyzed_comments', 'started_at', 'completed_at']
#     list_filter = ['status', 'started_at']
#     readonly_fields = ['started_at']
