from django.apps import AppConfig


class YoutubeAnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'youtube_analytics'
    verbose_name = 'YouTube Analytics'
    
    def ready(self):
        """App is ready - import signals if any"""
        try:
            import youtube_analytics.signals
        except ImportError:
            pass
