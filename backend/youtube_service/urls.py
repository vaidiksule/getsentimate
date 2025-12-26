from django.urls import path
from . import views

app_name = "youtube_service"

urlpatterns = [
    path("oauth/", views.YouTubeOAuthView.as_view(), name="youtube_oauth"),
    path(
        "channel/connect/",
        views.ChannelConnectionView.as_view(),
        name="channel_connect",
    ),
    path(
        "channel/<str:channel_id>/videos/",
        views.ChannelVideosView.as_view(),
        name="channel_videos",
    ),
    path(
        "video/<str:video_id>/comments/",
        views.VideoCommentsView.as_view(),
        name="video_comments",
    ),
]
