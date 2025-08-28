# GetSentimate Codebase Summary

## Project Overview
GetSentimate is a web application that analyzes YouTube video comments using AI services. It provides sentiment analysis, toxicity detection, and comment summarization for YouTube videos through a credit-based system.

## Architecture
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Django REST Framework with MongoDB
- **Database**: MongoDB (using PyMongo)
- **AI Services**: Google Gemini API for sentiment analysis and toxicity detection
- **Authentication**: Google OAuth 2.0 with JWT tokens

## Project Structure

### Backend (`/backend/`)

#### Core Django Configuration
- **`core/s`**: Main Django project configuration
  - `settings.py`: Django settings, CORS, REST framework, JWT configuration
  - `urls.py`: Main URL routing
  - `database.py`: MongoDB connection utilities
  - `asgi.py` & `wsgi.py`: ASGI/WSGI configuration

#### API Layer (`/api/`)
- **`urls.py`**: API endpoint routing
- **`views/`**: Request handlers
  - `general.py`: Main business logic (video analysis, comments, user management)
  - `auth.py`: Google OAuth authentication
  - `admin_views.py`: Admin dashboard endpoints
- **`services/`**: Business logic services
  - `youtube_service.py`: YouTube API integration
  - `ai_service.py`: AI analysis services (Gemini)
  - `mongodb_service.py`: Database operations
- **`serializers.py`**: Data serialization
- **`authentication.py`**: JWT authentication middleware
- **`jwt_utils.py`: JWT token utilities

#### Key Backend Features
1. **YouTube Integration**
   - Video metadata extraction
   - Comment fetching (limited to 100 comments)
   - Video ID extraction from various URL formats

2. **AI Analysis Services**
   - Sentiment analysis (positive/negative/neutral)
   - Toxicity detection (toxic/non-toxic)
   - Comment summarization
   - Key topics extraction

3. **User Management**
   - Google OAuth authentication
   - Credit system (5 credits for new users)
   - User profile management
   - Video and comment tracking

4. **Database Operations**
   - MongoDB collections: users, videos, comments, analysis_sessions
   - Proper indexing for performance
   - Connection management and cleanup

### Frontend (`/frontend/`)

#### Next.js Application Structure
- **`src/app/`**: App router structure
  - `page.tsx`: Landing page
  - `dashboard/page.tsx`: Main dashboard
  - `layout.tsx`: Root layout with authentication
  - `globals.css`: Global styles

#### Components (`/components/`)
- **`VideoInput.tsx`**: YouTube URL input and video processing
- **`CommentList.tsx`**: Display analyzed comments
- **`SentimentChart.tsx`**: Sentiment distribution visualization
- **`ToxicityChart.tsx`**: Toxicity distribution visualization
- **`AnalyticsDashboard.tsx`**: Analytics overview
- **`UserProfile.tsx`**: User profile management
- **`CreditDisplay.tsx`**: Credit balance display
- **`GoogleLoginButton.tsx`: Google OAuth login
- **`AuthProvider.tsx`: Authentication context provider
- **`LoadingSpinner.tsx`**: Loading states
- **`Summary.tsx`**: Comment summary display
- **`AIServiceStatus.tsx`**: AI service availability status

#### Utilities
- **`lib/fetchClient.ts`**: HTTP client utilities

## Key Features

### 1. Video Analysis Pipeline
1. User inputs YouTube URL
2. System extracts video ID and fetches metadata
3. Fetches up to 100 comments from YouTube API
4. Stores video and comments in MongoDB
5. Analyzes comments using AI services
6. Generates sentiment and toxicity reports
7. Provides comment summarization and key topics

### 2. Credit System
- New users get 5 credits
- 1 credit per video comment fetch
- 1 credit per comment analysis batch
- Credit validation before operations
- Insufficient credit error handling

### 3. Authentication Flow
- Google OAuth 2.0 integration
- JWT token generation and validation
- Protected API endpoints
- User session management

### 4. Data Management
- MongoDB collections with proper indexing
- User-video-comment relationships
- Analysis session tracking
- Data persistence and retrieval

## API Endpoints

### Public Endpoints
- `GET /api/`: Health check
- `GET /api/test/`: Connection test
- `GET /api/ai-status/`: AI service status

### Protected Endpoints (Authentication Required)
- `POST /api/youtube/fetch-comments/`: Fetch YouTube comments
- `POST /api/youtube/analyze-comments/`: Analyze comments
- `GET /api/analytics/<video_id>/`: Video analytics
- `GET /api/user/profile/`: User profile
- `GET /api/user/credits/`: User credits
- `GET /api/user/videos/`: User's videos

### Admin Endpoints
- `GET /api/admin/metrics/summary/`: Admin metrics
- `GET /api/metrics/users/`: User metrics

## Technical Implementation Details

### Database Schema
```javascript
// Users Collection
{
  google_id: String,
  name: String,
  email: String,
  avatar: String,
  credits: Number,
  videos_fetched: Number,
  total_analyses: Number,
  account_joined_at: Date,
  last_active: Date
}

// Videos Collection
{
  video_id: String,
  title: String,
  channel_id: String,
  channel_title: String,
  user_id: ObjectId,
  user_google_id: String,
  created_at: Date,
  comments_analyzed: Number
}

// Comments Collection
{
  comment_id: String,
  video_id: String,
  text: String,
  author_name: String,
  sentiment_score: Number,
  sentiment_label: String,
  toxicity_score: Number,
  toxicity_label: String,
  analyzed: Boolean,
  user_google_id: String
}
```

### Error Handling
- Comprehensive try-catch blocks
- Proper HTTP status codes
- User-friendly error messages
- Credit validation
- Database connection management

### Performance Optimizations
- MongoDB indexing on frequently queried fields
- Connection pooling and cleanup
- Batch comment analysis
- Efficient data retrieval patterns

## Development Setup

### Environment Variables Required
- `DATABASE_URL`: MongoDB connection string
- `YOUTUBE_API_KEY`: YouTube Data API key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `SECRET_KEY`: Django secret key

### Dependencies
- **Backend**: Django, DRF, PyMongo, python-dotenv, google-auth
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS

## Current Issues & Areas for Improvement

### Known Issues
- API endpoints being called multiple times (4x) - likely due to React StrictMode or async handling
- Need for better concurrency control in backend operations

### Potential Improvements
- Implement rate limiting
- Add caching for frequently accessed data
- Implement background job processing for large comment sets
- Add more comprehensive error logging
- Implement retry mechanisms for failed AI analysis
- Add data export functionality
- Implement user preferences and settings

## Security Considerations
- JWT token validation
- User authentication on protected endpoints
- Credit system prevents abuse
- Input validation and sanitization
- CORS configuration for frontend access

## Scalability Features
- MongoDB for flexible document storage
- Stateless API design
- Modular service architecture
- Efficient database indexing
- Batch processing capabilities

This codebase represents a well-structured, feature-rich application for YouTube comment analysis with proper separation of concerns, comprehensive error handling, and a scalable architecture.
