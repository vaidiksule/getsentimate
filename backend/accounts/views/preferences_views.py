import json
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from ..models import MongoUserPreference


class UserPreferencesView(APIView):
    """User preferences management"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            preferences = MongoUserPreference.objects(user=user).first()

            if not preferences:
                # Create default preferences
                preferences = MongoUserPreference.objects.create(user=user)

            return Response(
                {
                    "preferences": {
                        "default_channel": preferences.default_channel,
                        "videos_per_page": preferences.videos_per_page,
                        "auto_refresh_enabled": preferences.auto_refresh_enabled,
                        "refresh_interval": preferences.refresh_interval,
                        "default_analysis_type": preferences.default_analysis_type,
                        "include_toxicity_analysis": preferences.include_toxicity_analysis,
                        "save_analysis_history": preferences.save_analysis_history,
                        "email_notifications": preferences.email_notifications,
                        "analysis_complete_notifications": preferences.analysis_complete_notifications,
                    }
                }
            )

        except Exception as e:
            print(f"Failed to get preferences: {e}")
            return Response(
                {"error": "Failed to get preferences"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request):
        try:
            user = request.user
            data = json.loads(request.body)

            preferences = MongoUserPreference.objects(user=user).first()
            if not preferences:
                preferences = MongoUserPreference.objects.create(user=user)

            # Update allowed fields
            if "default_channel" in data:
                preferences.default_channel = data["default_channel"]
            if "videos_per_page" in data:
                preferences.videos_per_page = data["videos_per_page"]
            if "auto_refresh_enabled" in data:
                preferences.auto_refresh_enabled = data["auto_refresh_enabled"]
            if "refresh_interval" in data:
                preferences.refresh_interval = data["refresh_interval"]
            if "default_analysis_type" in data:
                preferences.default_analysis_type = data["default_analysis_type"]
            if "include_toxicity_analysis" in data:
                preferences.include_toxicity_analysis = data[
                    "include_toxicity_analysis"
                ]
            if "save_analysis_history" in data:
                preferences.save_analysis_history = data["save_analysis_history"]
            if "email_notifications" in data:
                preferences.email_notifications = data["email_notifications"]
            if "analysis_complete_notifications" in data:
                preferences.analysis_complete_notifications = data[
                    "analysis_complete_notifications"
                ]

            preferences.save()

            return Response(
                {
                    "message": "Preferences updated successfully",
                    "preferences": {
                        "default_channel": preferences.default_channel,
                        "videos_per_page": preferences.videos_per_page,
                        "auto_refresh_enabled": preferences.auto_refresh_enabled,
                        "refresh_interval": preferences.refresh_interval,
                        "default_analysis_type": preferences.default_analysis_type,
                        "include_toxicity_analysis": preferences.include_toxicity_analysis,
                        "save_analysis_history": preferences.save_analysis_history,
                        "email_notifications": preferences.email_notifications,
                        "analysis_complete_notifications": preferences.analysis_complete_notifications,
                    },
                }
            )

        except Exception as e:
            print(f"Failed to update preferences: {e}")
            return Response(
                {"error": "Failed to update preferences"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
