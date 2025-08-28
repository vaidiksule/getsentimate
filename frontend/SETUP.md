# GetSentimate Frontend Setup Guide

## 🚀 Quick Start

### 1. Environment Variables Setup

Create a `.env.local` file in the frontend directory:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 2. Google OAuth Setup

#### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google+ API
   - Google Sign-In API
   - YouTube Data API v3

#### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add these Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
5. Add these Authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard`
6. Copy the Client ID and add it to your `.env.local` file

### 3. Backend Setup

Make sure your Django backend is running and has the corresponding environment variables:

```bash
# Backend Environment Variables (.env file)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:3000
```

### 4. Start the Application

```bash
# Terminal 1: Start Backend
cd backend
python manage.py runserver

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

## 🔧 Troubleshooting

### Common Issues

1. **"Google OAuth not configured" error**
   - Check that `.env.local` exists and has the correct Google Client ID
   - Ensure the Google Cloud Console project has the required APIs enabled

2. **"Authentication failed" error**
   - Verify backend is running on `http://localhost:8000`
   - Check that backend has the correct Google credentials
   - Ensure CORS is properly configured on the backend

3. **"Popup blocked" error**
   - Allow popups for `localhost:3000`
   - Check browser console for additional error details

### Testing Without Google OAuth

If you want to test the UI without setting up Google OAuth:

1. Click the "Demo Mode" button on the landing page
2. This will take you to the dashboard (though authentication features won't work)
3. You can still see the redesigned UI and navigation

## 📱 Features Available

- ✅ **Landing Page**: Professional design with feature showcase
- ✅ **Authentication**: Google OAuth integration
- ✅ **Dashboard**: Overview, videos, channels, and profile tabs
- ✅ **Video Library**: Browse and analyze YouTube videos
- ✅ **Channel Management**: Connect and manage YouTube channels
- ✅ **User Profile**: Account settings and preferences
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **Modern UI**: Clean, minimalistic design with shadcn/ui components

## 🎨 Design System

The frontend uses a consistent design system:
- **Colors**: Neutral (white/black) with blue/green accents
- **Typography**: Clean, readable fonts
- **Components**: shadcn/ui for consistent UI elements
- **Animations**: Framer Motion for smooth interactions
- **Charts**: Recharts for data visualization

## 🔒 Security Notes

- Google OAuth tokens are handled securely
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- All API calls include proper authentication headers
- CORS is configured for local development

## 🚀 Next Steps

After setup:
1. Test the Google login flow
2. Connect a YouTube channel
3. Analyze some videos
4. View the insights dashboard

For production deployment:
1. Update environment variables with production URLs
2. Configure proper CORS settings
3. Use secure cookie storage for tokens
4. Set up proper error monitoring
