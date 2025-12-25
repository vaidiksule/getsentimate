from django.contrib.auth.models import AnonymousUser
from accounts.models import MongoUser


class MongoBackend:
    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Authenticate user with email and password
        """
        try:
            if not email or not password:
                return None
                
            user = MongoUser.objects(email=email).first()
            if user and user.check_password(password):
                return user
            return None
        except Exception as e:
            print("MongoBackend.authenticate error:", e)
            return None
    
    def authenticate_google(self, request, google_sub=None, google_email=None, **kwargs):
        """
        Authenticate user via Google OAuth
        """
        try:
            # First try to find by google_sub
            if google_sub:
                user = MongoUser.objects(google_sub=google_sub).first()
                if user:
                    return user
            
            # Then try to find by google_email
            if google_email:
                user = MongoUser.objects(google_email=google_email).first()
                if user:
                    return user
                    
            return None
        except Exception as e:
            print("MongoBackend.authenticate_google error:", e)
            return None
    
    def get_user(self, user_id):
        try:
            return MongoUser.objects(id=user_id).first()
        except Exception as e:
            print("MongoBackend.get_user error:", e)
            return None


def get_user(request):
    user_id = request.session.get("_auth_user_id")

    if not user_id:
        return AnonymousUser()

    backend = MongoBackend()
    user = backend.get_user(user_id)

    return user if user else AnonymousUser()


def login(request, user):
    """
    Mongo-only session login
    """
    request.session["_auth_user_id"] = str(user.id)
    request.session["_auth_backend"] = "accounts.backends.MongoBackend"
    request.user = user
