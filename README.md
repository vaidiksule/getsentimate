Great — here’s a **clear, detailed handoff document** you can paste directly into **Cursor** to continue working confidently there.

---

## 🧠 Project: GetSentimate — Smart YouTube Comment Analyzer

### 🎯 Problem

YouTubers and creators deal with thousands of comments daily. Important feedback, potential opportunities, or harmful content often get buried.

### 💡 Solution

**GetSentimate** is an AI-powered YouTube comment analyzer. It provides:

* **Smart sentiment & toxicity filters**
* **Summarized comment insights**
* **Custom rule-based filtering**
* **Searchable semantic clustering**
* **Visual dashboards for creators**

---

## ✅ Current Status

We are starting fresh and have completed the **Django backend setup** using Python 3.10 and Django 4.x. Frontend will be built in Next.js and deployed via Vercel.

---

## 🧱 Tech Stack (MVP)

| Layer        | Tech                                |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 14 + Tailwind CSS              |
| Backend      | Django 4.2 (Python 3.10)            |
| DB (Primary) | MongoDB (via Djongo)                |
| Vector DB    | Qdrant (comment embeddings)         |
| Auth         | Google OAuth                        |
| AI/NLP       | OpenAI GPT-4o                       |
| Async Tasks  | Celery + Redis                      |
| Deployment   | Render (Backend), Vercel (Frontend) |

---

## 📁 Current Project Structure

```bash
getsentimate/
├── backend/              # Django backend folder
│   ├── core/             # Django project
│   │   ├── settings.py   # Configuration
│   │   ├── urls.py       # URL routing
│   │   └── wsgi.py       # WSGI entry point
│   ├── manage.py         # Django CLI
│   └── requirements.txt  # Python dependencies
├── frontend/             # Next.js app (planned)
├── venv/                 # Virtual environment (local)
└── README.md
```

---

## 🔧 What’s Set Up Already

* ✅ Fresh virtual environment using Python 3.10
* ✅ Django 4.2 project created inside `backend/core`
* ✅ Dependencies installed (see below)
* ✅ Local run tested successfully
* ✅ Clean `requirements.txt` generated

### 🔗 requirements.txt snapshot:

```txt
Django>=4.2,<5.0
djongo
pymongo
djangorestframework
django-cors-headers
gunicorn
whitenoise
python-decouple
python-dotenv
sqlparse
tzdata
requests
```

---

## 📌 What Comes Next

You can continue inside Cursor with:

1. ✅ Creating the main `api/` Django app
2. ✅ Setting up MongoDB connection in `settings.py`
3. ✅ Adding CORS middleware for frontend requests
4. ✅ Implementing Comment model + parsing endpoint
5. ✅ Setting up frontend to call backend
6. ✅ Deploy backend on Render

---

## 🧪 Development Notes

* We're using **Djongo** to connect Django ORM to MongoDB
* Frontend and backend will be deployed separately
* `.env` will store all secrets like DB URI, API keys, etc.
* We'll integrate OpenAI and Qdrant later once basic comment ingestion works

---

## 🔐 Environment Variables Plan

Create a `.env` in `backend/`:

```
SECRET_KEY=your-django-secret
DEBUG=True
MONGO_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
```

Use with `python-decouple` and `dotenv`.

---

## 🧠 Reminder for Cursor Agent

Continue building the MVP:

* Step-by-step API endpoints
* Mongo models
* Frontend connection
* NLP-based comment tagging
* Dashboard views

Ask for:

* "Write DRF serializer"
* "Add Mongo model"
* "Create sentiment analysis endpoint"
* "Help with Qdrant connection"

---

Let me know when you’re ready for Render deploy setup or frontend Next.js bootstrapping — I’ll walk you through that too.
