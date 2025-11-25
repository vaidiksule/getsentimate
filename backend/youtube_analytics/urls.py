from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views
from .views import URLAnalysisView
from . import google_auth_views
from . import credit_views

# API Router
router = DefaultRouter()

# URL patterns
urlpatterns = [
    # Google OAuth Authentication
    path('auth/login/', google_auth_views.google_oauth_login, name='google_oauth_login'),
    path('auth/callback/', google_auth_views.google_oauth_callback, name='google_oauth_callback'),
    path('auth/me/', google_auth_views.auth_me, name='auth_me'),
    path('auth/logout/', google_auth_views.auth_logout, name='auth_logout'),

    # Authentication (existing)
    path('auth/<str:action>/', views.AuthView.as_view(), name='auth'),

    # Credits System
    path('credits/', credit_views.credit_balance, name='credit_balance'),
    path('credits/consume/', credit_views.consume_credits_view, name='consume_credits'),
    path('credits/topup/', credit_views.topup_credits, name='topup_credits'),
    path('credits/history/', credit_views.credit_history, name='credit_history'),
    path('credits/admin/history/', credit_views.admin_credit_history, name='admin_credit_history'),

    # URL-based Analysis (no auth, primary analysis endpoint)
    path('analysis/url/', URLAnalysisView.as_view(), name='url_analysis'),
    
    # Test endpoint for Postman (bypasses CSRF)
    path('test/analysis/', views.TestAnalysisView.as_view(), name='test_analysis'),
    
    # User Profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Service Status
    path('status/', views.ServiceStatusView.as_view(), name='status'),
]

# Include router URLs
urlpatterns += router.urls
