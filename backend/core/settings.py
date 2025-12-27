import os
from pathlib import Path
from decouple import config
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --------------------
# BASE DIR
# --------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------
# SECURITY
# --------------------
SECRET_KEY = config("SECRET_KEY", default="changeme-in-production")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*").split(",")

# --------------------
# INSTALLED APPS
# --------------------
INSTALLED_APPS = [
    # Django Core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    # Local apps
    "accounts",
    "credits",
    "payments",
    "transactions",
    "youtube_service",
    "analysis_service",
]


# --------------------
# MIDDLEWARE
# --------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "accounts.middleware.MongoAuthMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# --------------------
# TEMPLATES
# --------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --------------------
# URLS / WSGI
# --------------------
ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"

# --------------------
# DATABASE
# --------------------
# Django ORM is not used for application data; all persistence goes through MongoDB
# via mongoengine. We configure a dummy backend so Django doesn't try to use SQLite.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.dummy",
    }
}

# MongoDB Configuration
MONGODB_DATABASE_NAME = "getsentimate"
MONGODB_URI = os.getenv("DATABASE_URL")

# Force MongoDB to use 'getsentimate' database
MONGODB_DATABASE_NAME = "getsentimate"

# Import MongoDB configuration
try:
    from .mongo_config import connect_to_mongodb

    # Connect to MongoDB on startup
    connect_to_mongodb()
except Exception as e:
    print(f"Warning: Could not connect to MongoDB: {e}")

# --------------------
# AUTHENTICATION
# --------------------
# Use custom authentication backend instead of Django's default User model
# AUTH_USER_MODEL = 'accounts.MongoUser'  # Cannot use MongoEngine document as Django user model

AUTHENTICATION_BACKENDS = ("accounts.backends.MongoBackend",)

LOGIN_REDIRECT_URL = "/analysis"
LOGOUT_REDIRECT_URL = "/"

# --------------------
# REST FRAMEWORK
# --------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.drf_auth.MongoJWTAuthentication",
        "accounts.drf_auth.MongoSessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
}

# --------------------
# JWT SETTINGS (optional for future)
# --------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
}

# --------------------
# GOOGLE OAUTH SETTINGS
# --------------------
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
FRONTEND_AFTER_LOGIN = config(
    "FRONTEND_AFTER_LOGIN", default="http://localhost:3000/analysis"
)
FRONTEND_AFTER_LOGOUT = config(
    "FRONTEND_AFTER_LOGOUT", default="http://localhost:3000/"
)

# --------------------
# SESSION SETTINGS
# --------------------
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_COOKIE_DOMAIN = None  # Allow all domains
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = True

# --------------------
# DEPLOYMENT SETTINGS
# --------------------
# Trust the X-Forwarded-Proto header from the proxy (Render)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --------------------
# SOCIAL ACCOUNT PROVIDERS
# --------------------
# (Manual implementation used in google_auth_views.py)

# --------------------
# PASSWORD VALIDATORS
# --------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --------------------
# I18N / TIMEZONE
# --------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# --------------------
# STATIC FILES
# --------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# --------------------
# CORS SETTINGS
# --------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Replace with your frontend's origin
    "https://getsentimate.vercel.app",
    "https://www.getsentimate.vercel.app",
    "https://getsentimate.com",
    "https://www.getsentimate.com",
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Allow cross-domain cookies (needed for different domains)
CORS_ALLOW_HEADERS = [
    "content-type",
    "authorization",
    "x-csrftoken",
    "x-session-id",  # Add this for cross-domain session handling
]

# --------------------
# CSRF SETTINGS
# --------------------
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "https://getsentimate.vercel.app",
    "https://www.getsentimate.vercel.app",
    "https://getsentimate.com",
    "https://www.getsentimate.com",
]

# --------------------
# DEFAULT AUTO FIELD
# --------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------
# AI SERVICES
# --------------------
QDRANT_URL = config("QDRANT_URL", default=None)
QDRANT_API_KEY = config("QDRANT_API_KEY", default=None)
OPENAI_API_KEY = config("OPENAI_API_KEY", default=None)
GOOGLE_API_KEY = config(
    "GOOGLE_API_KEY", default=config("GEMINI_API_KEY", default=None)
)

# --------------------
# RAZORPAY SETTINGS
# --------------------
RAZORPAY_KEY_ID = config("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = config("RAZORPAY_KEY_SECRET", default="")
RAZORPAY_WEBHOOK_SECRET = config("RAZORPAY_WEBHOOK_SECRET", default="")
