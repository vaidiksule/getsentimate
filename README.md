# GetSentimate

AI-powered YouTube comment analysis platform for creators to understand audience feedback, sentiment, suggestions, and pain points — beyond basic YouTube analytics.

---

## 🧱 Tech Stack

- **Frontend:** Next.js 14 + TailwindCSS
- **Backend:** Django + Django REST Framework
- **AI:** Gemini Pro
- **Database:** SQLite (for development)

---

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

### 📝 To Do
- Setup backend API
- Connect Next.js frontend
- Add YouTube OAuth
- Build comment summary module
- Build dashboard UI
- Deploy MVP