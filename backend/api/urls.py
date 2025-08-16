from django.urls import path
from .views import general, auth, admin_views

urlpatterns = [
    # Test and health endpoints
    path('', general.health_check, name='health_check'),
    path('test/', general.test_connection, name='test_connection'),
    path('ai-status/', general.ai_service_status, name='ai_service_status'),

    # Comment endpoints
    path('comments/', general.comments_list, name='comments_list'),
    path('comments/<str:comment_id>/', general.comment_detail, name='comment_detail'),

    # Video analysis endpoints
    path('analyze/', general.analyze_video, name='analyze_video'),
    path('analysis/<int:session_id>/', general.analysis_status, name='analysis_status'),
    path('analytics/<str:video_id>/', general.video_analytics, name='video_analytics'),

    # YouTube integration endpoints
    path('youtube/fetch-comments/', general.fetch_youtube_comments, name='fetch_youtube_comments'),
    path('youtube/analyze-comments/', general.analyze_comments, name='analyze_comments'),
    path('youtube/video/<str:video_id>/', general.video_info, name='video_info'),
    path('youtube/debug/<str:video_id>/', general.debug_video_comments, name='debug_video_comments'),

    # Authentication endpoints
    path('auth/google/', auth.google_auth, name='google-auth'),
    path('me/', auth.get_me, name='get-me'),
    
    # User profile and credit management
    path('user/profile/', general.user_profile, name='user_profile'),
    path('user/videos/', general.user_videos, name='user_videos'),
    path('user/credits/', general.user_credits, name='user_credits'),

    # Admin endpoints
    path('admin/metrics/summary/', admin_views.admin_metrics_summary, name='admin_metrics_summary'),

    # Metrics endpoints
    path('metrics/users/', admin_views.metrics_users, name='metrics_users'),
]