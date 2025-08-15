# GetSentimate Roadmap

## Vision
Build a web platform where YouTubers and content creators can analyze comments on their videos using AI to extract sentiment, toxicity, key topics, pain points, and actionable suggestions. Users sign up via OAuth, track videos, and get AI-powered insights for better engagement.

---

## 1. User Authentication & Profile
- **OAuth Signup/Login**: Use Google OAuth for authentication.
- **JWT Authentication**: Generate JWT token after login for frontend-backend communication.
- **User Profile**: Store user info in MongoDB.
  - Fields: `user`, `google_id`, `avatar`, `credits`.
  - Assign **5 free credits** on signup.
- **Future**: Track credit usage for analysis requests.

---

## 2. Video Management
- Users can **submit YouTube video URLs**.
- Store video info in MongoDB.
  - Fields: `video_id`, `title`, `channel_id`, `channel_title`, `published_at`, `view_count`, `like_count`, `comment_count`.
- Each video is tied to a specific user.
- Maintain timestamps for creation and updates.

---

## 3. Comment Management
- Fetch comments and video transcript using YouTube API.
- Store comments in MongoDB linked to videos.
  - Fields: `comment_id`, `author_name`, `author_channel_url`, `text`, `like_count`, `published_at`.
- Initialize analysis fields as empty/unset.

---

## 4. Analysis Workflow
- Users spend a credit to analyze a video.
- Create an `AnalysisSession` to track analysis progress.
- **AI Analysis**:
  - Send video transcript + comments to **Gemini API**.
  - Use transcript for video context.
  - Gemini returns analysis JSON including:
    - `sentiment_score`, `sentiment_label`
    - `toxicity_score`, `toxicity_label`
    - `summary`, `key_topics`, `suggestions`, `pain_points`
- Update `Comment` objects with analysis results.
- Update `AnalysisSession` status and counts.

---

## 5. API Endpoints
1. **Authentication**
   - `POST /api/auth/google/` → OAuth login/signup → returns JWT token
2. **Video Management**
   - `POST /api/videos/` → Add video URL → store metadata
   - `GET /api/videos/` → List user’s videos
3. **Analysis**
   - `POST /api/videos/<id>/analyze/` → Fetch comments → call Gemini → store analysis
   - `GET /api/videos/<id>/analysis/` → Return analyzed data for frontend
4. **User Profile**
   - `GET /api/profile/` → Return user info & credits

---

## 6. Frontend Flow
1. User logs in via Google → receives JWT token.
2. User submits a YouTube video URL.
3. User triggers **analyze comments**.
4. Frontend polls for analysis completion or fetches results via endpoint.
5. Display analytics: sentiment, toxicity, summary, key topics, pain points, suggestions.

---

## 7. Future Enhancements
- Track credit consumption and purchase options.
- Schedule automatic analysis for new comments.
- Add video analytics dashboard with trends.
- Allow multiple AI models for analysis (Gemini, OpenAI, etc.).
- Multi-language support for comments.

---

## 8. Database Schema Overview
- `UserProfile` → stores user info + credits
- `Video` → stores video metadata per user
- `Comment` → stores all comments + AI analysis results
- `AnalysisSession` → tracks per-video analysis progress
