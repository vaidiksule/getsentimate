"""
Accounts views module.

This package contains all view classes for the accounts app, organized by functionality:
- auth_views: Registration, login, logout
- user_views: User profile and current user info
- google_views: Google OAuth authentication
- preferences_views: User preferences management
"""

from .auth_views import RegisterView, LoginView, LogoutView
from .user_views import CurrentUserView, UserProfileView
from .google_views import GoogleAuthView, GoogleAuthCallbackView
from .preferences_views import UserPreferencesView

__all__ = [
    # Auth views
    "RegisterView",
    "LoginView",
    "LogoutView",
    # User views
    "CurrentUserView",
    "UserProfileView",
    # Google views
    "GoogleAuthView",
    "GoogleAuthCallbackView",
    # Preferences views
    "UserPreferencesView",
]
