# 🪁 Windsurf Prompt — Add Credits System (Free 20 credits, 1 credit per analysis)

Paste the entire contents of this file into Windsurf to implement a complete credits system (backend + frontend) integrated with the existing Google-auth flow and analysis feature.

This prompt assumes:
- Backend: Django (REST API), already has user auth (`/auth/me`, sessions via httpOnly cookie).
- Frontend: Next.js (already calls `/auth/me` for auth state).
- You already have an `Analysis` operation that should be gated by credits.

---

## 🎯 High-level requirements

1. New user account receives **20 free credits** on signup.
2. Each **analysis costs 1 credit** — deny analysis if credits < 1.
3. Expose endpoints for:
   - Getting credit balance
   - Consuming 1+ credits atomically
   - Adding credits (admin or purchase)
4. Frontend:
   - Show user credit balance in header / profile
   - Prevent/disable "Run Analysis" when credits < 1 and show CTA to top-up
   - Show success / error messages on consume
5. Secure, transactional, tested, and admin-visible (Django admin).
6. Provide hooks for payments that can top-up credits later (placeholder webhooks).

---

## 🧩 Implementation plan (backend — Django)

### 1) Models & migration
- Create `CreditAccount` model (one-to-one to `User`) with fields:
  - `user = OneToOneField(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name="credit_account")`
  - `balance = IntegerField(default=0)`  # non-negative
  - `created_at = DateTimeField(auto_now_add=True)`
  - `updated_at = DateTimeField(auto_now=True)`
- Signal: on user creation (post_save), create `CreditAccount` and **credit 20 initial credits**.
- Add optional `CreditTransaction` model for audit/history:
  - `user`, `amount` (positive for add, negative for spend), `type` (choices: INIT, ANALYSIS, TOPUP, ADMIN_ADJUST), `reference` (optional, e.g., invoice id), `created_at`.

### 2) Atomic consumption helper
- Add a backend helper function to consume credits **atomically** using DB-level locks to avoid race conditions:
  - Example (pseudo):
    ```python
    from django.db import transaction

    def consume_credits(user, amount=1):
        with transaction.atomic():
            account = CreditAccount.objects.select_for_update().get(user=user)
            if account.balance < amount:
                raise InsufficientCredits()
            account.balance -= amount
            account.save()
            CreditTransaction.objects.create(user=user, amount=-amount, type="ANALYSIS")
            return account.balance
    ```
- Return new balance or raise clear exceptions.

### 3) Endpoints (Django REST or simple views)
- `GET /credits/` → returns `{ balance: int }` (200 or 401)
- `POST /credits/consume/` → body `{ amount: 1 }` (default 1)
  - Auth required
  - Use `consume_credits()` helper
  - If success → 200 `{ balance: new_balance }`
  - If insufficient → 402 or 400 `{ error: "Insufficient credits" }`
- `POST /credits/topup/` → admin-only OR used by payment webhook
  - body `{ user_id, amount, reference? }`
  - Creates a CreditTransaction type TOPUP and increases balance atomically
- `GET /credits/history/` → returns recent `CreditTransaction` entries (auth -> own user; admin -> all)

> NOTE: Protect `topup` endpoint (admin token or internal API key). Use `@staff_member_required` or internal signing.

### 4) Hook consumption into Analysis flow
- When frontend requests an analysis:
  - Option A (preferred): Frontend calls `POST /analysis/` and backend:
    - Calls `consume_credits(user, amount=1)` inside same atomic transaction or before performing heavy work.
    - If consume succeeds, proceed with analysis operation, and return result.
    - If analysis job is asynchronous (background task), **reserve** the credit at request time and mark transaction as RESERVED; if job fails, refund the credit.
  - Option B (if analysis is client-triggered): Frontend calls `POST /credits/consume/` first, then calls the analysis endpoint. (Less ideal — race conditions; prefer server-side gating.)

### 5) Refund / failure handling
- If analysis is synchronous and throws error → refund by creating a `CreditTransaction` with positive amount; update balance atomically.
- If analysis is asynchronous:
  - Create a `CreditTransaction` with `type=RESERVE` and `amount=-1` at request time.
  - When job completes successfully, update transaction type to `ANALYSIS` (keep negative).
  - If job fails or aborted, create a `REFUND` transaction `+1`.

### 6) Admin UI & tooling
- Register `CreditAccount` and `CreditTransaction` in Django admin.
- Provide admin action to adjust credits (add/remove) with reason.
- Add periodic audit script to verify sums and no negative balances.

### 7) Tests
- Unit tests:
  - On signup user gets 20 credits (assert `CreditAccount.balance == 20`).
  - `consume_credits` reduces balance, blocks when insufficient.
  - Concurrency test: two simultaneous requests attempting to consume credits when only 1 credit remains — ensure only one succeeds.
  - Refund on failure: when analysis raises, credit is refunded.
  - `topup` endpoint requires admin/auth.
- Integration tests:
  - E2E: sign up → /credits → run analysis → balance decremented, result returned.

---

## 🧭 Frontend changes (Next.js)

### 1) Show balance in header/profile
- On app hydration, fetch `/credits/` (with `credentials: 'include'`) and display a small badge: `Credits: 20`.
- Update balance in UI after successful analysis.

### 2) Disable/guard "Run Analysis" button
- If balance < 1:
  - Disable `Run Analysis` button.
  - Show help text: "You need credits to run an analysis. Free trial: 20 credits. [Top up]"

### 3) Consumption flow (recommended server-first)
- Frontend calls `POST /analysis/` (the analysis endpoint).
- Backend will handle `consume_credits` and either:
  - Return analysis result directly (sync).
  - Or return job accepted (202) and the frontend will poll status. The UI should show a temporary deduction (optimistic) and reflect final balance when job completes.
- On success: fetch `/credits/` and update UI.

### 4) Top-up UI
- Add CTA linking to "Top up" page with payment UI (Stripe / Razorpay) integration later.
- For now, show a modal with admin contact or testing top-up (if dev): allow POST to `/credits/topup/` if user is flagged as dev/test (or hidden dev mode).

### 5) Error handling
- If server returns insufficient error, show a clear modal: "You are out of credits — purchase more or contact support."

---

## 🔒 Security & concurrency notes

- Always use DB transactions + `select_for_update()` to avoid race conditions when mutating balance.
- Do not allow negative balances.
- Protect `topup` endpoint (admin key or signed webhook for payment providers).
- Rate-limit consumption endpoints to avoid abuse (e.g., max analyses per minute).
- Log credit consumption for auditing.

---

## 📦 Deliverables (what Windsurf should commit)

1. Django:
   - `CreditAccount` & `CreditTransaction` models + migrations
   - Post-save signal to create/seed 20 credits on new users
   - `consume_credits` helper with atomic locking
   - API endpoints: `/credits/`, `/credits/consume/`, `/credits/topup/`, `/credits/history/`
   - Integration with `POST /analysis/` to atomically reserve/consume credits
   - Admin registration + admin actions to adjust credits
   - Unit & integration tests
   - docs: `docs/credits.md` explaining endpoints and top-up webhook spec

2. Next.js:
   - Header/profile badge showing live credits
   - Guard logic for routes (`/` and `/analysis`) to check credits & auth
   - Disable Run Analysis when credits < 1 + CTA to top-up
   - Update balance UI after analysis
   - Simple top-up placeholder page (payment integration later)

3. CI:
   - Tests for credit system included in CI pipeline

---

## ✅ Acceptance criteria

- New users automatically have **20 credits** immediately after signup.
- Running an analysis when balance ≥ 1 consumes exactly 1 credit and returns the analysis result.
- Running an analysis when balance < 1 is blocked and returns an informative error.
- Concurrency: multiple simultaneous consume attempts cannot drop balance below zero.
- Admins can top up users; top-ups reflected immediately.
- Frontend shows up-to-date balance and disables analysis when insufficient.

---

## 📝 WINDSURF PROMPT (copy-and-paste this block into Windsurf)

Task: Implement credit system for our Django+Next.js app. Requirements:

New users receive 20 free credits on signup.

1 analysis costs 1 credit.

Implement models, migrations, atomic consume helper, endpoints, admin UI, tests, and frontend UI as described below.

Backend (Django):

Models:

CreditAccount (one-to-one User): fields user, balance (int, default 0), created_at, updated_at

CreditTransaction: fields user, amount (int), type (choices: INIT, ANALYSIS, RESERVED, REFUND, TOPUP, ADMIN_ADJUST), reference (optional), created_at

Signals:

On User post_save (created=True): create CreditAccount and create CreditTransaction(amount=+20, type=INIT). Set account.balance = 20.

Helper:

Implement consume_credits(user, amount=1) that uses transaction.atomic + select_for_update() to ensure atomicity. On success, create CreditTransaction(amount=-amount, type=ANALYSIS or RESERVED) and return new balance. On insufficient balance, raise InsufficientCredits exception.

Endpoints:

GET /credits/ -> returns { balance: int }

POST /credits/consume/ -> { amount: int } -> consumes credits via helper, returns new balance or 402/400 error on insufficient credits

POST /credits/topup/ -> admin-only or protected -> { user_id | user_email, amount, reference? } -> increase balance atomically and create TOPUP transaction

GET /credits/history/ -> paginated transaction history for the user (auth required)

Analysis integration:

Ensure analysis endpoint calls consume_credits atomically. If analysis is async, implement RESERVE (-1) at request and REFUND (+1) on failure.

Admin:

Register models in Django admin and add admin action to adjust credits.

Tests:

Unit tests for initial credits, consume flow, insufficient error, concurrency, topup security, refund logic.

Docs:

Add docs/credits.md describing endpoints, sample requests, webhook spec for payments.

Frontend (Next.js):

Fetch GET /credits/ on app load (credentials: 'include') and show Credits: N in header/profile.

Guard UI:

Disable "Run Analysis" if balance < 1 and show a CTA to top up.

When user visits /analysis and is not authenticated, redirect to /

Run Analysis:

Call POST /analysis/ (backend handles consume). On success, update credits by re-fetching /credits/ and show result.

If backend returns insufficient credits error, show modal with top-up CTA.

Top-up:

Implement placeholder Top-up page with instructions and dev-mode top-up (POST /credits/topup/ protected).

Tests:

Component tests for header badge and disabled Run Analysis state.

Security & Misc:

Use transaction.atomic and select_for_update() to prevent race conditions.

Do not allow negative balances.

Protect top-up endpoint (admin-only or signed webhook).

Add logging/auditing for all consume/topup actions.

Acceptance criteria:

New user: 20 credits created on signup.

Analysis when balance >=1 reduces balance by 1.

Analysis when balance <1 blocked.

Concurrency safe.

Admin top-up works and is protected.