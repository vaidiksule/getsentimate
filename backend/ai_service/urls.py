from django.urls import path
from . import views

app_name = 'ai_service'

urlpatterns = [
    path('url/', views.URLAnalysisView.as_view(), name='url_analysis'),
    path('analyze/<str:video_id>/', views.CommentAnalysisView.as_view(), name='comment_analysis'),
    path('history/', views.AnalysisHistoryView.as_view(), name='analysis_history'),
    path('status/<str:analysis_id>/', views.AnalysisStatusView.as_view(), name='analysis_status'),
]
