from django.urls import path
# from rest_framework_simplejwt.views import TokenRefreshView
from .views import general, auth

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
]
