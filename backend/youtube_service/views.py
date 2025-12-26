import json
from datetime import timedelta
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from .youtube_api_service import YouTubeAPIService


class YouTubeOAuthView(APIView):
    """Handle YouTube OAuth token exchange"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get YouTube authorization code
            data = json.loads(request.body)
            code = data.get("code")
            redirect_uri = data.get("redirect_uri")

            if not code:
                return Response(
                    {"error": "Authorization code is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Exchange code for tokens
            from accounts.google_auth_views import exchange_code_for_tokens

            token_data = exchange_code_for_tokens(code, request, redirect_uri)

            if not token_data:
                return Response(
                    {"error": "Failed to exchange authorization code"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update user's YouTube tokens
            user = request.user
            user.youtube_access_token = token_data.get("access_token")
            user.youtube_refresh_token = token_data.get("refresh_token")
            user.token_expiry = timezone.now() + timedelta(
                seconds=token_data.get("expires_in", 3600)
            )
            user.save()

            return Response(
                {
                    "message": "YouTube OAuth successful",
                    "token_data": {
                        "access_token": token_data.get("access_token"),
                        "expires_in": token_data.get("expires_in"),
                        "token_type": token_data.get("token_type"),
                    },
                }
            )

        except Exception as e:
            print(f"YouTube OAuth failed: {e}")
            return Response(
                {"error": "YouTube OAuth failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChannelConnectionView(APIView):
    """Connect to a YouTube channel"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = json.loads(request.body)
            channel_id = data.get("channel_id")

            if not channel_id:
                return Response(
                    {"error": "Channel ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = request.user
            youtube_service = YouTubeAPIService()

            # Check if user has valid YouTube tokens
            if not user.youtube_access_token:
                return Response(
                    {
                        "error": "YouTube access token not found. Please connect your YouTube account first."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Validate channel and get channel info
            channel_info = youtube_service.get_channel_info(
                channel_id, user.youtube_access_token
            )
            if not channel_info:
                return Response(
                    {"error": "Invalid channel ID or no access to channel"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update user's active channel
            user.is_active_channel = channel_id
            user.save()

            return Response(
                {"message": "Channel connected successfully", "channel": channel_info}
            )

        except Exception as e:
            print(f"Failed to connect channel: {e}")
            return Response(
                {"error": "Failed to connect channel"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChannelVideosView(APIView):
    """Get videos for a channel"""

    permission_classes = [IsAuthenticated]

    def get(self, request, channel_id=None):
        try:
            user = request.user
            youtube_service = YouTubeAPIService()

            # Use user's active channel if none provided
            if not channel_id:
                channel_id = user.is_active_channel

            if not channel_id:
                return Response(
                    {"error": "No channel specified"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if user has valid YouTube tokens
            if not user.youtube_access_token:
                return Response(
                    {
                        "error": "YouTube access token not found. Please connect your YouTube account first."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Get videos for the channel
            videos = youtube_service.get_channel_videos(
                channel_id, user.youtube_access_token
            )

            return Response({"videos": videos})

        except Exception as e:
            print(f"Failed to get channel videos: {e}")
            return Response(
                {"error": "Failed to get channel videos"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VideoCommentsView(APIView):
    """Get comments for a video"""

    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        try:
            user = request.user
            youtube_service = YouTubeAPIService()

            # Check if user has valid YouTube tokens
            if not user.youtube_access_token:
                return Response(
                    {
                        "error": "YouTube access token not found. Please connect your YouTube account first."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Get comments for the video
            comments = youtube_service.get_video_comments(
                video_id, user.youtube_access_token
            )

            return Response({"comments": comments, "video_id": video_id})

        except Exception as e:
            print(f"Failed to get video comments: {e}")
            return Response(
                {"error": "Failed to get video comments"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
