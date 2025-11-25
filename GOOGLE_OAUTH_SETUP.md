# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for GetSentimate.

## Overview

The implementation uses Django session-based authentication with Google OAuth 2.0 Authorization Code Flow.

## Backend Setup

### 1. Environment Variables

Add these to your `.env` file in the backend:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URLs
FRONTEND_URL=http://localhost:3000
FRONTEND_AFTER_LOGIN=http://localhost:3000/analysis
FRONTEND_AFTER_LOGOUT=http://localhost:3000/
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/callback/` (development)
   - `https://your-backend.com/api/auth/callback/` (production)
7. Copy Client ID and Client Secret to your `.env` file

### 3. Database Migration

Run migrations to add Google OAuth fields to User model:

```bash
python3 manage.py migrate
```

## Frontend Setup

### 1. Environment Variables

Add to your `.env.local` file in the frontend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Authentication Flow

The authentication works as follows:

1. **Login**: User clicks "Sign in with Google" → redirects to `/api/auth/login/`
2. **OAuth**: Google redirects to `/api/auth/callback/` with authorization code
3. **Token Exchange**: Backend exchanges code for tokens and creates user session
4. **Redirect**: User is redirected to `/analysis` page
5. **Session Management**: All API calls include session cookies automatically

### 3. Route Protection

- `/` (home): Shows login page for unauthenticated users, redirects to `/analysis` for authenticated users
- `/analysis`: Requires authentication, redirects to `/` if not logged in

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login/` | GET | Redirect to Google OAuth |
| `/api/auth/callback/` | GET | Handle OAuth callback |
| `/api/auth/me/` | GET | Get current user info |
| `/api/auth/logout/` | POST | Logout user |

### Usage Examples

#### Check Authentication Status
```typescript
import { checkAuth } from '@/lib/auth';

const user = await checkAuth();
if (user) {
  console.log('User is authenticated:', user.name);
} else {
  console.log('User is not authenticated');
}
```

#### Logout
```typescript
import { logout } from '@/lib/auth';

const success = await logout();
if (success) {
  window.location.href = '/';
}
```

## Security Notes

1. **Session Cookies**: Uses httpOnly, secure, and SameSite=Lax cookies
2. **CSRF Protection**: State parameter prevents CSRF attacks
3. **Token Verification**: ID tokens are verified (simplified for development)
4. **Environment Variables**: Never commit secrets to version control

## Development vs Production

### Development
- Uses `http://localhost:3000` and `http://localhost:8000`
- Session cookies work without HTTPS
- Debug mode enabled

### Production
- Update FRONTEND_URL to your production domain
- Ensure HTTPS is enabled
- Set DEBUG=False in Django settings
- Update CORS settings for production domains

## Testing the Flow

1. Start Django backend: `python3 manage.py runserver`
2. Start Next.js frontend: `npm run dev`
3. Visit `http://localhost:3000`
4. Click "Sign in with Google"
5. Complete OAuth flow
6. Should be redirected to `/analysis` with user info displayed

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure the redirect URI in Google Console matches your backend URL
2. **CORS Issues**: Check CORS_ALLOWED_ORIGINS in Django settings
3. **Cookie Issues**: Ensure domains match between frontend and backend
4. **Environment Variables**: Double-check all required variables are set

### Debug Mode

Enable debug logging by setting DEBUG=True in Django settings to see detailed OAuth flow logs.

## Next Steps

This implementation provides a foundation for:
- User-specific analysis history
- Enhanced security features
- User preferences and settings
- Multi-user support
