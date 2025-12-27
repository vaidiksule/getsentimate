from django.urls import path
from . import views
from . import google_auth_views
from .views.razorpay_test_login import RazorpayTestLoginView

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("temp-login/", RazorpayTestLoginView.as_view(), name="temp_login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.CurrentUserView.as_view(), name="current_user"),
    # Google OAuth
    path("google/", views.GoogleAuthView.as_view(), name="google_auth"),
    path(
        "google/login/", google_auth_views.google_oauth_login, name="google_oauth_login"
    ),
    path(
        "google/callback/",
        google_auth_views.google_oauth_callback,
        name="google_auth_callback",
    ),
    # User profile
    path("profile/", views.UserProfileView.as_view(), name="user_profile"),
    path(
        "profile/preferences/",
        views.UserPreferencesView.as_view(),
        name="user_preferences",
    ),
]
