from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views
from .views import URLAnalysisView

# API Router
router = DefaultRouter()

# URL patterns
urlpatterns = [
    # Authentication
    path('auth/<str:action>/', views.AuthView.as_view(), name='auth'),

    # URL-based Analysis (no auth, primary analysis endpoint)
    path('analysis/url/', URLAnalysisView.as_view(), name='url_analysis'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Service Status
    path('status/', views.ServiceStatusView.as_view(), name='status'),
]

# Include router URLs
urlpatterns += router.urls
