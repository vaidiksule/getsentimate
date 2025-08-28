# GetSentimate Backend - YouTube Analytics Platform

## 🎯 **Overview**
This is the backend for GetSentimate, a professional YouTube channel analytics platform that helps creators understand their audience through deep comment analysis and video insights.

## 🏗️ **Architecture**

### **Tech Stack**
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: SQLite (development) / MongoDB (production ready)
- **Authentication**: Google OAuth 2.0 with JWT tokens
- **YouTube Integration**: Google YouTube Data API v3
- **AI Analysis**: Google Gemini API for sentiment/toxicity analysis

### **Project Structure**
```
backend/
├── core/                    # Django project settings
├── youtube_analytics/      # Main app
│   ├── models.py          # Data models
│   ├── serializers.py     # API serializers
│   ├── views.py           # API endpoints
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin
│   └── services/          # Business logic
│       ├── youtube_service.py  # YouTube API integration
│       └── ai_service.py       # AI analysis service
├── manage.py              # Django management
└── requirements.txt       # Python dependencies
```

## 🚀 **Getting Started**

### **Prerequisites**
- Python 3.8+
- Google Cloud Platform account
- YouTube Data API v3 enabled
- Google Gemini API key

### **Environment Setup**
1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key"
   export YOUTUBE_API_KEY="your_youtube_api_key"  # Optional
   export DATABASE_URL="your_mongodb_url"  # For production
   ```

4. **Run migrations**
   ```bash
   python3 manage.py makemigrations
   python3 manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python3 manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python3 manage.py runserver 8000
   ```

## 📊 **Data Models**

### **User**
- Extended Django user with Google OAuth integration
- YouTube access tokens and channel preferences
- Multiple channel support

### **Channel**
- YouTube channel information and statistics
- Subscriber counts, video counts, view counts
- Connection status and sync timestamps

### **Video**
- YouTube video metadata and statistics
- Thumbnails, duration, engagement metrics
- Analysis status flags

### **Comment**
- Video comments with author information
- Sentiment and toxicity analysis results
- Engagement metrics (likes, timestamps)

### **AnalysisResult**
- Comprehensive video analysis results
- Sentiment distribution, toxicity scores
- AI-generated insights and recommendations

### **UserPreference**
- User display and analysis preferences
- Notification settings
- Default channel and pagination settings

## 🔌 **API Endpoints**

### **Authentication**
- `POST /api/auth/google/` - Google OAuth login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - Logout

### **Channels**
- `GET /api/channels/` - List user's channels
- `POST /api/channels/` - Connect new channels
- `GET /api/channels/{id}/` - Get channel details
- `PUT /api/channels/{id}/` - Switch active channel

### **Videos**
- `GET /api/videos/` - List videos from active channel
- `POST /api/videos/` - Fetch videos from YouTube
- `GET /api/videos/{id}/` - Get video details
- `GET /api/videos/{id}/comments/` - Get video comments

### **Analysis**
- `POST /api/analysis/{video_id}/` - Analyze video comments
- `GET /api/analysis/{video_id}/` - Get analysis results

### **User Profile**
- `GET /api/profile/` - Get user profile
- `PUT /api/profile/` - Update preferences

### **Service Status**
- `GET /api/status/` - Check service health

## 🔧 **Services**

### **YouTube Service**
- Channel connection and management
- Video fetching and metadata retrieval
- Comment collection and processing
- OAuth token management

### **AI Service**
- Sentiment analysis using Google Gemini
- Toxicity detection and classification
- Audience insights generation
- Fallback analysis methods

## 🛡️ **Security Features**

- **JWT Authentication**: Secure token-based authentication
- **OAuth 2.0**: Secure Google account integration
- **Permission System**: Role-based access control
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API usage protection (future)

## 📈 **Performance Features**

- **Lazy Loading**: Services initialize only when needed
- **Database Indexing**: Optimized query performance
- **Caching**: API response caching (future)
- **Batch Processing**: Efficient bulk operations
- **Async Support**: Background task processing (future)

## 🧪 **Testing**

### **Run Tests**
```bash
python3 manage.py test youtube_analytics
```

### **Test Coverage**
```bash
coverage run --source='.' manage.py test
coverage report
```

## 🚀 **Deployment**

### **Production Settings**
- Set `DEBUG = False`
- Configure production database (PostgreSQL/MySQL)
- Set secure `SECRET_KEY`
- Configure CORS for production domains
- Enable HTTPS

### **Environment Variables**
```bash
DEBUG=False
SECRET_KEY=your_secure_secret_key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:port/db
GEMINI_API_KEY=your_gemini_key
YOUTUBE_API_KEY=your_youtube_key
```

## 🔍 **Admin Interface**

Access Django admin at `/admin/` to manage:
- Users and authentication
- YouTube channels and videos
- Analysis results and comments
- System configuration

## 📚 **API Documentation**

### **Authentication Flow**
1. Frontend initiates Google OAuth
2. Backend receives OAuth tokens
3. JWT tokens generated and returned
4. Frontend uses JWT for API calls

### **Data Flow**
1. User connects YouTube channel
2. Videos fetched from YouTube API
3. Comments collected and analyzed
4. Insights generated using AI
5. Results stored and displayed

## 🐛 **Troubleshooting**

### **Common Issues**
- **YouTube API Quotas**: Check API usage limits
- **Authentication Errors**: Verify OAuth credentials
- **Database Issues**: Check migrations and connections
- **AI Service**: Verify Gemini API key and quotas

### **Logs**
Check Django logs for detailed error information:
```bash
python3 manage.py runserver --verbosity 2
```

## 🤝 **Contributing**

1. Follow Django coding standards
2. Add tests for new features
3. Update documentation
4. Use meaningful commit messages

## 📄 **License**

This project is part of GetSentimate and follows the same license terms.

---

**For more information, see the main project README and ROADMAP.md**
