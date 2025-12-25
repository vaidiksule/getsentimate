# Backend Reorganization Plan

## Goal
Reorganize the Django backend into clear, single‑responsibility apps for scalability, maintainability, and easier debugging.

## Current Situation
- Everything lives in a single `youtube_analytics` app.
- Mixed concerns: auth, credits, analysis, YouTube API, AI service.
- Hard to scale and debug as the codebase grows.

## Proposed App Structure

### 1. `core`
- Purpose: Shared utilities, base settings, middleware, and common helpers.
- Contents:
  - `settings.py` (already in `core/`)
  - `urls.py` (root URLconf, includes other apps)
  - `wsgi.py`, `asgi.py` (already in `core/`)
  - `mongo_config.py` (already in `core/`)
  - `exceptions.py` (custom exceptions)
  - `permissions.py` (DRF permission classes)
  - `pagination.py` (DRF paginators)
  - `middleware.py` (custom middleware)

### 2. `accounts`
- Purpose: User authentication, registration, Google OAuth, user profile.
- Contents:
  - `models.py`: `MongoUser`, `MongoUserPreference` (from `youtube_analytics/mongo_models.py`)
  - `views.py`: `AuthView`, `UserProfileView` (from `youtube_analytics/views.py`)
  - `serializers.py`: User profile serializers (if needed)
  - `auth.py` / `backends.py`: `MongoBackend` (from `youtube_analytics/mongo_auth.py`)
  - `urls.py`: `/auth/` routes (login, logout, me, profile)
  - `google_auth_views.py` (or merge into views)
  - `admin.py` (if you ever want admin UI for users)

### 3. `credits`
- Purpose: Credit system: balance, transactions, top‑up, history.
- Contents:
  - `models.py`: `MongoCreditAccount`, `MongoCreditTransaction` (from `youtube_analytics/mongo_models.py`)
  - `views.py`: `credit_balance`, `consume_credits_view`, `topup_credits`, `credit_history`, `admin_credit_history` (from `youtube_analytics/credit_views.py`)
  - `utils.py`: `get_credit_balance`, `consume_credits`, `add_credits`, `InsufficientCreditsError` (from `youtube_analytics/credit_utils.py`)
  - `serializers.py`: Minimal request/response serializers if needed
  - `urls.py`: `/credits/` routes
  - `admin.py` (optional)

### 4. `youtube_service`
- Purpose: YouTube API integration, fetching video metadata and comments.
- Contents:
  - `services/youtube_api_service.py` (from `youtube_analytics/services/youtube_api_service.py`)
  - `services/youtube_scraper_service.py` (from `youtube_analytics/services/youtube_scraper_service.py`)
  - `views.py`: `youtube_channels` (if you keep channel listing) or remove if unused
  - `urls.py`: `/youtube/` routes (if any)
  - `utils.py`: URL parsing helpers
  - `exceptions.py`: YouTube‑specific exceptions

### 5. `ai_service`
- Purpose: AI analysis (Gemini), comment sentiment/toxicity analysis.
- Contents:
  - `services/ai_service.py` (from `youtube_analytics/services/ai_service.py`)
  - `views.py`: `AnalysisView`, `URLAnalysisView`, `TestAnalysisView` (from `youtube_analytics/views.py`)
  - `serializers.py`: `CommentAnalysisSerializer`, `ChannelConnectionSerializer` (from `youtube_analytics/serializers.py`)
  - `urls.py`: `/analysis/` routes
  - `exceptions.py`: AI‑specific exceptions

### 6. `api` (optional thin wrapper)
- Purpose: Single entrypoint for API versioning.
- Contents:
  - `urls.py` includes `/api/v1/` prefixes and includes other apps.
  - Can be omitted if you prefer `/api/` in root `core/urls.py`.

## Migration Steps

### Step 1: Create the new apps
```bash
cd backend
python manage.py startapp accounts
python manage.py startapp credits
python manage.py startapp youtube_service
python manage.py startapp ai_service
# `core` already exists; we will repurpose it.
```

### Step 2: Move files and split models

#### `accounts`
- Move `youtube_analytics/mongo_auth.py` → `accounts/backends.py`
- Move `youtube_analytics/google_auth_views.py` → `accounts/views.py` (or merge)
- Move user-related models from `youtube_analytics/mongo_models.py` → `accounts/models.py`
- Create `accounts/urls.py`

#### `credits`
- Move `youtube_analytics/credit_utils.py` → `credits/utils.py`
- Move `youtube_analytics/credit_views.py` → `credits/views.py`
- Move credit models from `youtube_analytics/mongo_models.py` → `credits/models.py`
- Create `credits/urls.py`

#### `youtube_service`
- Move `youtube_analytics/services/youtube_api_service.py` → `youtube_service/services/youtube_api_service.py`
- Move `youtube_analytics/services/youtube_scraper_service.py` → `youtube_service/services/youtube_scraper_service.py`
- If you keep any YouTube views, move them.
- Create `youtube_service/urls.py` (or keep minimal)

#### `ai_service`
- Move `youtube_analytics/services/ai_service.py` → `ai_service/services/ai_service.py`
- Move analysis views from `youtube_analytics/views.py` → `ai_service/views.py`
- Move `youtube_analytics/serializers.py` → `ai_service/serializers.py`
- Create `ai_service/urls.py`

#### `core`
- Keep `core/settings.py`, `core/urls.py`, `core/wsgi.py`, `core/asgi.py`, `core/mongo_config.py`
- Add shared utilities (permissions, pagination, middleware) if desired.

### Step 3: Update imports

- In each moved file, update relative imports to match the new app structure.
- Example: `from .mongo_models import MongoUser` → `from accounts.models import MongoUser`
- Update `youtube_analytics/urls.py` (or replace it) to delegate to the new apps.

### Step 4: Configure Django settings

- Add the new apps to `INSTALLED_APPS` in `core/settings.py`:

```python
INSTALLED_APPS = [
    # Django defaults
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'allauth',
    'allauth.account',
    # Our apps
    'core',
    'accounts',
    'credits',
    'youtube_service',
    'ai_service',
]
```

### Step 5: Update root URLconf

- In `core/urls.py`, include the new apps:

```python
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('ai_service.urls')),  # or use versioned wrapper
    path('api/', include('accounts.urls')),
    path('api/', include('credits.urls')),
    path('api/', include('youtube_service.urls')),
    # health/status at root
    path('status/', include('ai_service.urls')),  # example
]
```

Or use a single `api/urls.py` wrapper for versioning.

### Step 6: Remove the old `youtube_analytics` app

- After confirming everything works, delete `youtube_analytics/` or keep it as a migration stub if you prefer.
- Remove from `INSTALLED_APPS`.

### Step 7: Test end‑to‑end

- Verify Google OAuth login works.
- Verify credit balance/history endpoints work.
- Verify video analysis (URL paste) works.
- Confirm all persistence goes to MongoDB.

## Benefits

- **Clear boundaries**: Each app owns its models, views, URLs, and utilities.
- **Scalability**: Teams can work on separate apps independently.
- **Testability**: Easier to unit‑test each app.
- **Debugging**: Smaller codebases per app reduce cognitive load.
- **Future extensions**: Add new apps (e.g., `notifications`, `billing`) without clutter.

## Optional Enhancements

- **Versioned API**: Use `api/v1/` prefixes via a wrapper app.
- **Shared utilities**: Keep a `core/utils.py` for common helpers.
- **Custom commands**: Management commands per app (e.g., `credits/topup_all_users`).
- **Docker compose**: Scale services per app if needed.

## Risks & Mitigations

- **Import churn**: Use IDE refactoring tools to bulk‑update imports.
- **Route conflicts**: Ensure URL prefixes don’t collide (`/api/auth/`, `/api/credits/`, `/api/analysis/`).
- **Migration history**: If you had migrations in `youtube_analytics`, keep a minimal stub or recreate migrations in new apps.

---

**Next**: If you approve, I’ll start by creating the apps and moving the files step‑by‑step, updating imports and `INSTALLED_APPS`/URLs as we go.