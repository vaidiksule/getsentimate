from mongoengine import (
    Document,
    StringField,
    IntField,
    DateTimeField,
    BooleanField,
    ReferenceField,
    URLField,
    EmailField,
)
from datetime import datetime
from django.contrib.auth.hashers import make_password, check_password


class MongoUser(Document):
    """MongoDB user model with Django compatibility"""

    # Basic user info
    username = StringField(max_length=150, required=True, unique=True)
    email = EmailField(required=True, unique=True)
    first_name = StringField(max_length=30)
    last_name = StringField(max_length=30)

    # Django auth compatibility
    password = StringField(
        max_length=128, required=False
    )  # Django hashed password (optional for OAuth users)
    is_active = BooleanField(default=True)
    is_staff = BooleanField(default=False)
    is_superuser = BooleanField(default=False)
    date_joined = DateTimeField(default=datetime.utcnow)
    last_login = DateTimeField()

    # Profile info
    profile_picture = URLField()
    bio = StringField(max_length=500)

    # Google OAuth fields
    google_sub = StringField(unique=True, sparse=True)  # Google Subject ID
    google_email = EmailField(
        sparse=True
    )  # Google email (may differ from primary email)
    google_access_token = StringField()
    google_refresh_token = StringField()
    google_token_expires_at = DateTimeField()

    # Auth Provider (for temporary test login)
    auth_provider = StringField(default="google", choices=["google", "local"])

    meta = {
        "collection": "users",
        "indexes": [
            "username",
            "email",
            "google_sub",
            # Remove google_email index to avoid conflict with existing unique sparse index
        ],
    }

    def __init__(self, *args, **kwargs):
        super(MongoUser, self).__init__(*args, **kwargs)

    @property
    def pk(self):
        """Django compatibility - primary key"""
        return self.id

    def get_username(self):
        """Django compatibility - get username"""
        return self.username

    def set_password(self, raw_password):
        """Set password using Django's password hashing"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check password using Django's password verification"""
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def youtube_access_token(self):
        """Backward compatibility property - maps to google_access_token"""
        return self.google_access_token


# Custom class-level _meta for Django compatibility (but preserve MongoEngine functionality)
def _get_django_meta():
    """Get Django-compatible meta object that preserves MongoEngine functionality"""
    # Get MongoEngine's original meta
    original_meta = MongoUser._meta

    class DjangoCompatibleMeta:
        def __init__(self, original_meta):
            self._original = original_meta

        def __getattr__(self, name):
            if name == "pk":
                # Return a custom field for Django compatibility
                class ObjectIdField:
                    def to_python(self, value):
                        return str(value) if value is not None else None

                    def value_to_string(self, obj):
                        return str(obj.id) if hasattr(obj, "id") and obj.id else ""

                return ObjectIdField()
            else:
                # Delegate to original MongoEngine meta for everything else
                return getattr(self._original, name)

        def __contains__(self, name):
            return name in self._original

        def __getitem__(self, name):
            return self._original[name]

        def get(self, name, default=None):
            return self._original.get(name, default)

    return DjangoCompatibleMeta(original_meta)


# Override class-level _meta with Django-compatible wrapper
MongoUser._meta = _get_django_meta()


class MongoUserPreference(Document):
    """MongoDB user preference model"""

    user = ReferenceField(MongoUser, required=True, unique=True)

    # Display preferences
    default_channel = StringField(max_length=100)
    videos_per_page = IntField(default=10)
    auto_refresh_enabled = BooleanField(default=True)
    refresh_interval = IntField(default=300)  # seconds

    # Analysis preferences
    default_analysis_type = StringField(max_length=50, default="sentiment")
    include_toxicity_analysis = BooleanField(default=True)
    save_analysis_history = BooleanField(default=True)

    # Notification preferences
    email_notifications = BooleanField(default=False)
    analysis_complete_notifications = BooleanField(default=True)

    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {"collection": "user_preferences", "indexes": ["user"]}

    def __str__(self):
        return f"UserPreference({self.user.username})"
