# 🧠 Project: GetSentimate - Smart YouTube Comment Analyzer


### 🎯 Problem

YouTubers and creators deal with thousands of comments daily. Important feedback, potential opportunities, or harmful content often get buried.

### 💡 Solution

**GetSentimate** is an AI-powered YouTube comment analyzer. It provides:

*   Smart sentiment & toxicity analysis using Gemini Pro
*   Summarized comment insights
*   Filters for finding specific feedback
*   Visual dashboards for creators

---

## ✅ Current Status

The core functionality is now implemented:

*   Django backend setup with Gemini Pro integration
*   Frontend setup with Next.js
*   YouTube comment fetching and analysis pipeline

### ⚠️ Important

*   OpenAI integration has been removed.
*   User authentication is currently disabled for simplified access.

---

## 🧱 Tech Stack

| Layer        | Tech                      |
| ------------ | ------------------------- |
| Frontend     | Next.js + Tailwind CSS    |
| Backend      | Django (Python)           |
| AI/NLP       | Google Gemini Pro         |
| Deployment   | (Future - Vercel/Render) |

---

## ⚙️ Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone [repository URL]
    cd getsentimate
    ```
2.  **Backend Setup:**

    *   Navigate to the `backend` directory.

        ```bash
        cd backend
        ```
    *   Create a virtual environment (recommended):

        ```bash
        python -m venv venv
        .\venv\Scripts\activate  # On Windows
        source venv/bin/activate   # On macOS and Linux
        ```
    *   Install dependencies:

        ```bash
        pip install -r requirements.txt
        ```
    *   Create a `.env` file in the `backend` directory with the following variables:

        ```
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
SECRET_KEY=your-django-secret-key
DEBUG=True
        ```
    *   Run migrations:

        ```bash
        python manage.py makemigrations api
        python manage.py migrate
        ```
    *   Start the development server:

        ```bash
        python manage.py runserver
        ```
3.  **Frontend Setup:**

    *   Navigate to the `frontend` directory.

        ```bash
        cd ../frontend
        ```
    *   Install dependencies:

        ```bash
        npm install
        ```
    *   Create a `.env.local` file with the following variable:

        ```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 # Or your backend URL
        ```
    *   Run the development server:

        ```bash
        npm run dev
        ```

---

## 🤝 Contribution Guidelines

Contributions are welcome! Please follow these guidelines:

*   Fork the repository.
*   Create a new branch for your feature or bug fix.
*   Submit a pull request with a clear description of your changes.

---
