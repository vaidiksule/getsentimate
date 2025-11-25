import json
import secrets
import requests
from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import User


def generate_state():
    """Generate a secure random state parameter for CSRF protection"""
    return secrets.token_urlsafe(32)


def google_oauth_login(request):
    """Redirect user to Google OAuth consent screen"""
    state = generate_state()
    request.session['oauth_state'] = state
    
    # Use backend URL for callback
    callback_url = f"{request.scheme}://{request.get_host()}/api/auth/callback/"
    
    params = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'redirect_uri': callback_url,
        'scope': 'openid email profile',
        'response_type': 'code',
        'state': state,
        'access_type': 'offline',  # To get refresh token
        'prompt': 'consent'  # Force consent to ensure refresh token
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return redirect(auth_url)


@csrf_exempt
def google_oauth_callback(request):
    """Handle Google OAuth callback"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    # Verify state parameter
    state = request.GET.get('state')
    stored_state = request.session.get('oauth_state')
    
    if not state or state != stored_state:
        return JsonResponse({'error': 'Invalid state parameter'}, status=400)
    
    # Clear state from session
    if 'oauth_state' in request.session:
        del request.session['oauth_state']
    
    # Get authorization code
    code = request.GET.get('code')
    if not code:
        error = request.GET.get('error', 'Unknown error')
        return JsonResponse({'error': f'Authorization failed: {error}'}, status=400)
    
    # Exchange code for tokens
    try:
        token_data = exchange_code_for_tokens(code, request)
        id_token = token_data.get('id_token')
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        
        if not id_token:
            return JsonResponse({'error': 'Failed to obtain ID token'}, status=400)
        
        # Verify and decode ID token
        user_info = verify_id_token(id_token)
        if not user_info:
            return JsonResponse({'error': 'Invalid ID token'}, status=400)
        
        # Create or get user
        user = create_or_get_user(user_info, refresh_token)
        
        # Log in user (creates session)
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        
        # Ensure session is saved
        request.session.save()
        
        # Debug: Check if session was created
        print(f"Session after login: {request.session.session_key}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"Session data: {dict(request.session)}")
        print(f"Session saved: {request.session.modified}")
        
        # For cross-domain scenarios, include session ID in redirect URL
        frontend_url = settings.FRONTEND_AFTER_LOGIN
        if 'getsentimate.com' in frontend_url and 'getsentimate.onrender.com' in request.get_host():
            # Cross-domain scenario - pass session ID as query param
            session_id = request.session.session_key
            separator = '&' if '?' in frontend_url else '?'
            redirect_url = f"{frontend_url}{separator}session_id={session_id}"
            print(f"Cross-domain redirect with session: {redirect_url}")
            return redirect(redirect_url)
        
        # Same domain scenario - normal redirect
        return redirect(settings.FRONTEND_AFTER_LOGIN)
        
    except Exception as e:
        return JsonResponse({'error': f'OAuth callback failed: {str(e)}'}, status=500)


def exchange_code_for_tokens(code, request):
    """Exchange authorization code for access and ID tokens"""
    # Use backend URL for callback
    callback_url = f"{request.scheme}://{request.get_host()}/api/auth/callback/"
    
    data = {
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': callback_url
    }
    
    response = requests.post('https://oauth2.googleapis.com/token', data=data)
    response.raise_for_status()
    
    return response.json()


def verify_id_token(id_token):
    """Verify Google ID token and extract user info"""
    try:
        # For production, you should verify the token with Google's public keys
        # For now, we'll decode without verification (NOT SECURE FOR PRODUCTION)
        import jwt
        decoded = jwt.decode(id_token, options={"verify_signature": False})
        
        return {
            'sub': decoded.get('sub'),  # Google subject ID
            'email': decoded.get('email'),
            'name': decoded.get('name'),
            'picture': decoded.get('picture'),
            'email_verified': decoded.get('email_verified', False)
        }
    except Exception as e:
        print(f"ID token verification failed: {str(e)}")
        return None


def create_or_get_user(user_info, refresh_token=None):
    """Create or get user from Google user info"""
    google_sub = user_info['sub']
    email = user_info['email']
    name = user_info.get('name', '')
    picture = user_info.get('picture', '')
    
    # Try to find user by google_sub first
    try:
        user = User.objects.get(google_sub=google_sub)
        # Update user info
        user.google_email = email
        user.profile_picture = picture
        user.first_name = name.split(' ')[0] if name else ''
        user.last_name = ' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else ''
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.save()
        return user
    except User.DoesNotExist:
        pass
    
    # Try to find user by email
    try:
        user = User.objects.get(google_email=email)
        # Update with google_sub and other info
        user.google_sub = google_sub
        user.profile_picture = picture
        user.first_name = name.split(' ')[0] if name else ''
        user.last_name = ' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else ''
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.save()
        return user
    except User.DoesNotExist:
        pass
    
    # Create new user
    username = email.split('@')[0]
    # Ensure unique username
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1
    
    user = User.objects.create_user(
        username=username,
        email=email,
        first_name=name.split(' ')[0] if name else '',
        last_name=' '.join(name.split(' ')[1:]) if name and len(name.split(' ')) > 1 else '',
        google_sub=google_sub,
        google_email=email,
        profile_picture=picture,
        google_refresh_token=refresh_token
    )
    
    return user


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_me(request):
    """Get current authenticated user info"""
    # Handle cross-domain session ID
    session_id_from_header = request.headers.get('X-Session-ID')
    if session_id_from_header:
        # Try to load session using the provided session ID
        from django.contrib.sessions.backends.db import SessionStore
        try:
            session = SessionStore(session_key=session_id_from_header)
            if session.exists(session_id_from_header):
                session_data = session.load()
                user_id = session_data.get('_auth_user_id')
                if user_id:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    user = User.objects.get(id=user_id)
                    
                    # Create a new session for this domain
                    from django.contrib.auth import login
                    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                    
                    print(f"Cross-domain auth successful for user: {user.email}")
                    return Response({
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'avatar': user.profile_picture,
                        'google_sub': user.google_sub,
                        'is_authenticated': True
                    })
        except Exception as e:
            print(f"Cross-domain session error: {e}")
    
    # Debug: Check session and authentication status
    print(f"auth_me - Session key: {request.session.session_key}")
    print(f"auth_me - User authenticated: {request.user.is_authenticated}")
    print(f"auth_me - User ID: {request.user.id if hasattr(request.user, 'id') else 'No user'}")
    print(f"auth_me - Session data: {dict(request.session)}")
    print(f"auth_me - Cookies: {request.COOKIES}")
    
    if request.user.is_authenticated:
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'avatar': user.profile_picture,
            'google_sub': user.google_sub,
            'is_authenticated': True
        })
    else:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@permission_classes([AllowAny])
def auth_logout(request):
    """Logout user and clear session"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        print(f"Logout - Request method: {request.method}")
        print(f"Logout - User authenticated: {request.user.is_authenticated}")
        print(f"Logout - User ID: {request.user.id if hasattr(request.user, 'id') else 'No user'}")
        print(f"Logout - Session key: {request.session.session_key}")
        print(f"Logout - Session data: {dict(request.session)}")
        print(f"Logout - Cookies: {request.COOKIES}")
        print(f"Logout - Headers: {dict(request.headers)}")
        
        # Handle cross-domain session ID
        session_id_from_header = request.headers.get('X-Session-ID')
        print(f"Logout - Session ID from header: {session_id_from_header}")
        
        if session_id_from_header and not request.user.is_authenticated:
            # Try to load session using the provided session ID
            from django.contrib.sessions.backends.db import SessionStore
            try:
                session = SessionStore(session_key=session_id_from_header)
                print(f"Logout - Session exists: {session.exists(session_id_from_header)}")
                
                if session.exists(session_id_from_header):
                    session_data = session.load()
                    print(f"Logout - Session data: {session_data}")
                    user_id = session_data.get('_auth_user_id')
                    print(f"Logout - User ID from session: {user_id}")
                    
                    if user_id:
                        from django.contrib.auth import get_user_model
                        User = get_user_model()
                        user = User.objects.get(id=user_id)
                        
                        # Create a new session for this domain
                        from django.contrib.auth import login
                        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                        
                        print(f"Cross-domain auth successful for logout: {user.email}")
                        print(f"After login - User authenticated: {request.user.is_authenticated}")
                        print(f"After login - User ID: {request.user.id}")
            except Exception as e:
                print(f"Cross-domain session error in logout: {e}")
        
        if not request.user.is_authenticated:
            print(f"Logout - User not authenticated, returning 401")
            return JsonResponse({'error': 'User not authenticated'}, status=401)
        
        logout(request)
        
        print(f"Logout - After logout: User authenticated: {request.user.is_authenticated}")
        
        return JsonResponse({'message': 'Successfully logged out'})
    except Exception as e:
        print(f"Logout error: {e}")
        return JsonResponse({'error': f'Logout failed: {str(e)}'}, status=500)
