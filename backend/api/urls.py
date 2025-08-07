from django.urls import path
from . import views

urlpatterns = [
    # Test and health endpoints
    path('', views.health_check, name='health_check'),
    path('test/', views.test_connection, name='test_connection'),
    path('ai-status/', views.ai_service_status, name='ai_service_status'),
    
    # Comment endpoints
    path('comments/', views.comments_list, name='comments_list'),
    path('comments/<str:comment_id>/', views.comment_detail, name='comment_detail'),
    
    # Video analysis endpoints
    path('analyze/', views.analyze_video, name='analyze_video'),
    path('analysis/<int:session_id>/', views.analysis_status, name='analysis_status'),
    path('analytics/<str:video_id>/', views.video_analytics, name='video_analytics'),
    
    # YouTube integration endpoints
    path('youtube/fetch-comments/', views.fetch_youtube_comments, name='fetch_youtube_comments'),
    path('youtube/analyze-comments/', views.analyze_comments, name='analyze_comments'),
    path('youtube/video/<str:video_id>/', views.video_info, name='video_info'),
    path('youtube/debug/<str:video_id>/', views.debug_video_comments, name='debug_video_comments'),
]
