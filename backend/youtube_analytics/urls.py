from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import mongo_views

# API Router
router = DefaultRouter()

# URL patterns
urlpatterns = [
    # Authentication
    path('auth/<str:action>/', views.AuthView.as_view(), name='auth'),
    
    # Channels
    path('channels/', views.ChannelView.as_view(), name='channels'),
    path('channels/<str:channel_id>/', views.ChannelDetailView.as_view(), name='channel_detail'),
    
    # Videos
    path('videos/', views.VideoView.as_view(), name='videos'),
    path('videos/<str:video_id>/', views.VideoDetailView.as_view(), name='video_detail'),
    
    # Analysis
    path('analysis/<str:video_id>/', views.AnalysisView.as_view(), name='analysis'),
    
    # Comments
    path('videos/<str:video_id>/comments/', views.CommentView.as_view(), name='comments'),
    
    # Video Insights
    path('videos/<str:video_id>/insights/', views.VideoInsightsView.as_view(), name='video_insights'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Service Status
    path('status/', views.ServiceStatusView.as_view(), name='status'),
    
    # MongoDB Enhanced Endpoints
    path('mongo/auth/<str:action>/', mongo_views.MongoAuthView.as_view(), name='mongo_auth'),
    path('mongo/channels/', mongo_views.MongoChannelView.as_view(), name='mongo_channels'),
    path('mongo/videos/', mongo_views.MongoVideoView.as_view(), name='mongo_videos'),
    path('mongo/videos/<str:video_id>/comments/', mongo_views.MongoCommentView.as_view(), name='mongo_comments'),
    path('mongo/videos/<str:video_id>/insights/', mongo_views.MongoVideoInsightsView.as_view(), name='mongo_video_insights'),
    path('mongo/user/<int:user_id>/stats/', mongo_views.MongoDashboardStatsView.as_view(), name='mongo_dashboard_stats'),
]

# Include router URLs
urlpatterns += router.urls
