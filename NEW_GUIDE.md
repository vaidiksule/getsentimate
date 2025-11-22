# GetSentimate Refactor – Paste-Link Comment Analysis (Windsurf Task)

## 🧩 Overview
Refactor the current GetSentimate codebase to remove YouTube channel connections and implement a **simplified user flow**:  
**Login with Google → Paste a YouTube video link → Get audience insights.**

This version should focus entirely on analyzing **individual YouTube videos via a pasted link**, instead of connecting entire channels.

---

## ✅ Goals

- 🔥 Remove all YouTube channel connection logic  
- ✅ Keep Google OAuth for authentication  
- 🔗 Let users **paste a YouTube video link** directly  
- 🤖 Use AI to analyze comments on that video  
- 🧠 Return clear insights based on **what YouTubers actually care about**

---

## 🔨 What to Change

### 1. Remove Channel & Video Browsing Logic
- Delete any code or UI related to:
  - Channel switching
  - Listing or browsing user videos
  - Fetching playlists or video metadata via OAuth scopes
- Remove unnecessary YouTube Data API usage (keep only what’s needed to fetch comments by video ID).

---

### 2. Keep Google OAuth (Auth Only)
- Do not change the login flow.
- Keep user login via Google OAuth with JWT/session handling.
- This is critical for future credit/token features.
- ✅ Do **not** implement credits now — just preserve the logic.

---

### 3. Replace Flow with Paste-Link System
- After login, take user to a clean page with:
  - Input to paste a YouTube video URL
  - “Analyze” button
  - Loading indicator
- Backend should:
  - Validate the URL
  - Extract video ID
  - Fetch comments for that video using the YouTube Data API
  - Analyze those comments using AI (Google Gemini API)

---

### 4. Comment Analysis Engine (AI Output)
Run analysis on fetched comments to extract:

- ✅ **Sentiment Breakdown**: % positive / neutral / negative  
- ✅ **Toxicity Detection**: Identify hate, spam, and aggressive content  
- ✅ **Themes & Topics**: Group comments into common phrases or topics  
- ✅ **Viewer Feedback**: What users liked / complained about / requested  
- ✅ **Actionable Insights**: Auto-generated tips like:  
  > “Viewers want more behind-the-scenes content.”  
  > “Your audience praised the editing in the last third.”

---

### 5. Insights UI
Design the result screen with these sections:

- **🎭 Sentiment Overview**: Text + simple percentage breakdown
- **⚠️ Toxic Comment Highlights**: List or count of flagged messages
- **💬 Key Themes**: What viewers kept repeating
- **📌 Viewer Suggestions**: Requests, praise, or questions
- **🧠 Actionable Insights**: Summary takeaways based on comment patterns

---

### 6. Retain (But Don't Use) Credit System
- Keep all token/credit logic in place.
- Don't activate usage limits or enforcement yet.
- Prepare system for later monetization.

---

### 7. Clean Codebase
- Remove old:
  - Endpoints for channels, playlists, and multi-video analysis
  - Components tied to channel switching or dashboards
- Add:
  - Endpoint to receive a pasted video link
  - Endpoint to trigger analysis and return results

---

## 📦 Tech Stack Requirements

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Django 4.2+, Django REST Framework, MongoDB
- **Auth**: Google OAuth 2.0
- **AI**: Google Gemini API for comment analysis
- **Comment Source**: YouTube Data API v3 (video comments only)

---

## 🧠 Psychology Behind the UX (What Creators Want)

YouTubers don't want full analytics dashboards — they want **fast insight** from their comments:

- Are viewers liking or hating the content?  
- What’s being repeated in comments?  
- Any hate/spam they missed?  
- What should they make next?  
- What parts of the video worked?

Your refactor should **remove friction** and **deliver value instantly**.

---

## 🧪 Deliverables

- ✅ Clean, auth-protected flow: Login → Paste Link → See Results  
- ✅ Fast backend analysis  
- ✅ All old channel code removed  
- ✅ Placeholder credit system kept intact  
- ✅ Simple, modern UI  
- ✅ Working end-to-end paste-link → insights flow

---

🎯 **This new version should feel like a tool made *for YouTubers* — simple, fast, and focused on what they care about most.**
