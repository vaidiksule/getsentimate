# GetSentimate: Current Simplified Analysis Flow

This document describes the **current, simplified flow** for analyzing a YouTube video by URL, without any authentication.

## High-Level Goal

- A user **pastes a YouTube video URL in the frontend** and
- The **backend fetches video + comments**, runs AI analysis, and
- Returns a rich JSON payload that powers the analytics UI.

Auth, Google sign‑in, and account-specific YouTube integrations are **not required** for this flow.

---

## Frontend

### Entry Point

- Component: `frontend/src/app/components/URLAnalysis.tsx`
- Typical usage: rendered on a page (e.g. home/dashboard) as the main "Paste URL and Analyze" UI.

### User Interaction

1. User pastes a YouTube URL into the input.
2. Client-side validation checks that the URL matches common YouTube patterns.
3. When the user clicks **Analyze Video**, the component calls the backend.

### Backend Call

`URLAnalysis.tsx` sends a **POST** request:

- **URL**: `http://localhost:8000/api/analysis/url/`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Body (JSON)**:

```json
{
  "url": "<youtube_video_url>",
  "max_comments": 100
}
```

> Note: No auth token is sent; this endpoint is **public**.

### Expected Response Shape

The component expects a response like:

```json
{
  "success": true,
  "message": "...",
  "video": {
    "id": "<video_id>",
    "title": "...",
    "description": "...",
    "thumbnail_url": "https://...jpg",
    "published_at": "2025-01-01T00:00:00Z",
    "view_count": 12345,
    "like_count": 678,
    "comment_count": 90,
    "channel_title": "Channel Name",
    "duration": "PT10M5S"
  },
  "analysis": {
    "total_comments_analyzed": 100,
    "analysis_timestamp": "2025-01-01T00:00:00Z",
    "ai_insights": { "...": "see AI service section" },
    "ai_error": "optional error string if AI fails",
    "topic_analysis": { "...": "topics and related data" },
    "persona_analysis": { "...": "viewer personas" },
    "actionable_insights": { "...": "action items" },
    "performance_score": { "...": "scored metrics" }
  },
  "comments_sample": [
    {
      "text": "comment text",
      "author_name": "Author",
      "like_count": 3,
      "published_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

The UI uses this to render:

- Video summary (title, channel, thumbnail, views/likes/comments/duration)
- Gauges and charts (performance, sentiment, engagement)
- Topic cloud and persona visuals
- Action items and key findings
- Sample comments

---

## Backend

### URL Routing

- Project URLs: `backend/core/urls.py`
  - Includes app URLs under `/api/`:
    - `path('api/', include('youtube_analytics.urls'))`

- App URLs: `backend/youtube_analytics/urls.py`
  - Public URL analysis endpoint:

```python
from .views import URLAnalysisView

urlpatterns = [
    # ... other routes ...

    # URL-based Analysis (no auth)
    path('analysis/url/', URLAnalysisView.as_view(), name='url_analysis'),
]
```

### URLAnalysisView (public, no auth)

- File: `backend/youtube_analytics/views.py`
- Class: `URLAnalysisView(APIView)`
- Purpose: **Analyze any YouTube video by URL**, without requiring a logged-in user.

Key steps inside `post(self, request)`:

1. **Read input**:
   - `url = request.data.get('url')`
   - `max_comments = request.data.get('max_comments', 100)` (validated to 1–1000)

2. **Validate**:
   - If `url` is missing → `400 {"error": "YouTube URL is required"}`

3. **Scrape video + comments (no Google OAuth needed)**:
   - Uses `get_youtube_scraper_service()` from `youtube_scraper_service.py`
   - Calls `youtube_scraper.analyze_video_by_url(url, max_comments)`
   - Returns `(success, message, analysis_data)` where `analysis_data` contains:
     - `video_id`
     - `video_details` (title, description, thumbnail, stats, duration…)
     - `comments` (raw scraped comments)
     - `total_comments_fetched`

4. **Convert comments for AI**:
   - Normalizes comment fields into a safe list `comments_for_analysis`:

```python
comments_for_analysis = [
    {
        'text': comment['text'],
        'author_name': comment['author_name'],
        'like_count': comment['like_count'],
        'published_at': <safe ISO string or None>,
    }
    for comment in analysis_data['comments']
]
```

5. **AI analysis**:
   - Uses `AIService.analyze_url_comments(...)` from `services/ai_service.py`
   - Produces a rich `ai_insights` structure (sentiment, topics, personas, recommendations, etc.).

6. **Response assembly**:
   - On AI success: returns full `video`, `analysis` (with `ai_insights`), and `comments_sample`.
   - On AI failure: still returns basic `video` + counts, but `ai_insights = None` and `ai_error` is set.

### Removed legacy endpoint `/api/analyze`

- Previously implemented in `backend/youtube_analytics/views_analysis.py` using `YouTubeService` and `CommentService`.
- That file and the related `youtube_service.py` / `comment_service.py` services have now been **deleted**.
- There is **no `/api/analyze` endpoint anymore**; all analysis must go through `/api/analysis/url/`.

---

## Authentication & Permissions (Current State)

- Global DRF settings (in `backend/core/settings.py`):
  - `DEFAULT_PERMISSION_CLASSES = ["rest_framework.permissions.AllowAny"]`
- `URLAnalysisView` does **not** declare any authentication/permission classes.
- Frontend no longer sends `Authorization` headers for URL-based analysis.

Result: **Anyone who can reach the backend can analyze a video by URL**.

Google OAuth, JWT auth, and account-specific YouTube features still exist in the codebase, but they are **not required** for the paste‑URL analysis flow and are effectively bypassed for this endpoint.

---

## How to Use (Developer / Manual Testing)

### From the Browser UI

1. Run the backend on `http://localhost:8000`.
2. Run the frontend on `http://localhost:3000`.
3. Open the page that renders `URLAnalysis` (e.g. home/dashboard).
4. Paste a YouTube video URL.
5. Click **Analyze Video**.
6. You should see:
   - Video card with thumbnail & stats
   - Gauges/charts
   - Topic cloud & personas
   - Action items & key findings
   - Comments sample

### Direct API Call Example

```bash
curl -X POST http://localhost:8000/api/analysis/url/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "max_comments": 100
  }'
```

---

## What You Can Safely Ignore For Now

For the current goal ("user pastes YouTube link and gets analysis"), you can mostly ignore:

- Google sign‑in / social auth views and configuration
- JWT authentication setup
- Comment storage in relational DB + MongoDB
- Channel dashboards and user-specific video management
- Legacy `/api/analyze/` endpoint using `YouTubeService` (unless you want that specific flow).

The **core path** you care about is:

**Frontend** `URLAnalysis.tsx` → **POST** `http://localhost:8000/api/analysis/url/` → `URLAnalysisView` → `YouTubeScraperService` → `AIService` → JSON response → analytics UI.
