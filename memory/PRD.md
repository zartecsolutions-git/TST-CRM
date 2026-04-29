# CRM Application — Product Requirements

## Original Problem Statement
Complete the CRM project. Requirements: real-time location tracking, modern design, Email/Password authentication, distinct roles (Admin, Sales, Support), mobile-friendly PWA, Leads Management, Sales Performance tracking, and Payments module.

### Roles & Access Matrix
- **super_admin**: Full system access incl. multi-company.
- **admin**: Manage users, teams, customers, products, leads, settings, reports.
- **sales**: Leads, activities, customers, products, sales invoices, payments, sales reports.
- **support**: Activities, customers, sales invoices, payments.
- **data_entry**: Full access to Customers, Products, Leads, Sales Invoices, Payments, Sales Reports. NO admin menus. NO "attached pics" upload controls in Product Details.
- **employee**: Daily Tasks ONLY.

### White-label Multi-Company Deployment
Branding driven by env vars:
- `REACT_APP_COMPANY_NAME`, `REACT_APP_COMPANY_LOGO_URL`, `REACT_APP_PRIMARY_COLOR`, `REACT_APP_SECONDARY_COLOR`.
- Guides: `MULTI_COMPANY_DEPLOYMENT_GUIDE.md`, `QUICK_CUSTOMIZATION_GUIDE.md`.

## Architecture
- Frontend: React + Tailwind CSS, PWA-enabled.
- Backend: FastAPI + Pydantic + Motor (Mongo).
- Auth: JWT (jose) + direct bcrypt hashing (NOT passlib).
- DB: MongoDB.

### Key Backend Modules
- `backend/auth.py` — JWT + bcrypt (verify_password / get_password_hash).
- `backend/rbac.py` — role guards (require_admin, require_admin_or_data_entry, etc.).
- `backend/routes/` — customer, lead, product, sales, payment, daily_task, user, team, company, dashboard, geofence routes.
- `backend/utils/` — datetime, validation, csv, dashboard helpers.

### Key Frontend Pages
- Dashboard, Activities, Customers, Products (uses `ProductsEnhanced.js`), Leads, Sales Invoices, Payments, Sales Reports, Daily Tasks, Users, Teams, Master Data, Reports, Company Settings, Login, Register.

## Changelog

### 2026-04-29 — Phase 2: httpOnly Cookie Auth Migration
- **Backend**:
  - `auth.py` rewrote `get_current_user` to read JWT from `auth_token` cookie first, fall back to `Authorization: Bearer …` header. Rejects literal `null` / `undefined` Bearer values. Added `set_auth_cookie` and `clear_auth_cookie` helpers configured for same-origin (`HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=7d`).
  - `routes/auth_routes.py` — login/register set the cookie alongside returning the token (transition compat); new `POST /api/auth/logout` clears the cookie. Logout is idempotent (no auth required) so the UX never hangs.
  - `AUTH_COOKIE_SECURE` env var (default `true`) — set `false` for local `http://localhost` dev.
- **Frontend**:
  - `utils/api.js` — `axios.defaults.withCredentials = true` so legacy raw `axios.X` calls auto-include the cookie. 401 response interceptor skips redirect on `/auth/me` AND when already on `/login` or `/register` (kills infinite-redirect loop).
  - `contexts/AuthContext.js` — bootstrap calls `/api/auth/me` on mount; login no longer stores token in `localStorage` (only the user object as a UX cache); logout calls `/api/auth/logout`.
  - `services/locationTracking.js` — `fetch` calls now use `credentials: 'include'` instead of injecting `Authorization: Bearer …` from localStorage.
  - `pages/DailyTasks.js` — `fetchOpts` helper sends `credentials: 'include'` on every raw fetch.
  - `contexts/LocationContext.js` — gates the location effect on a logged-in user (skips on `/login` to avoid 401 spam).
- **Backward compat**: legacy `Authorization: Bearer null` headers from un-migrated pages still work because backend ignores them and falls back to the cookie. Cleanup of those call sites is **Phase 2b**.
- **Verified**: Iteration_11 — Backend pytest 10/10 PASS, Frontend Playwright 7/7 PASS. Auth playbook saved at `/app/auth_testing.md`.

### 2026-04-28 — Code Quality Phase 1
- **Backend:**
  - Renamed shadowed `company` loop var in `routes/company_routes.py:41-47` (silenced false-positive "may be unbound").
  - Replaced bare `except:` with `except Exception:` in `server.py` and `utils/dependencies.py` ConnectionManager.broadcast.
  - Removed unused `data` var and 3 placeholder f-strings via `ruff --fix`.
- **Frontend:**
  - Replaced array-index `key`s with stable content-based keys across `SalesReports.js` (11 spots), `Activities.js` (2), `Leads.js` (2), `SalesInvoices.js` (1), `Geofences.js` (1), `AnalysisChart.jsx`, `CustomerProductFilters.jsx`. Index keys retained only for two legitimate cases (commission slab inputs in `Users.js` where index IS the controlled-input identity, and `SearchableSelect.jsx` keyboard highlight).
  - Empty `catch {}` → `console.error(error)` across 11 files (Customers, Leads, Payments, Products, ProductsEnhanced, SalesInvoices, CompanySettings, Reports, Dashboard, Login, locationTracking).
  - `useMemo` added to 5 flagged hot-path computations: `ActivityForm.jsx` supportUsers + productsForCustomer; `Activities.js` supportUsers; `LocationTracking.js` nonAdminUsers; `AnalysisChart.jsx` total; `ExcelImport.jsx` invoiceTotals.
  - `DailyTasks.js` — converted `fetchTasks`, `fetchCustomers`, `authHeaders` to `useCallback` and added them to the `useEffect` dep array.
- **Skipped (deliberately):**
  - `is None` / `is not None` (correct PEP 8 idiom — review was incorrect).
  - localStorage → httpOnly cookies migration (Phase 2 — requires dedicated session).
  - Splitting >500-line components and complex backend functions (Phase 3).
- **Verified:** Backend smoke 8/8 endpoints 200; ESLint + Ruff clean (excluding `server_old.py` dead-code).

### 2026-04-28 — data_entry FULL ACCESS Across CRM Modules
- **Backend**:
  - `customer_routes.py` POST: now allows `data_entry` (was admin/sales/support only).
  - `lead_routes.py` POST: now allows `data_entry` (was admin/sales only). Update/Delete already worked because `check_lead_ownership` only restricts the `sales` role to own leads.
  - Products, Sales Invoices, Payments POST/PUT/DELETE were already allowed for `data_entry` via existing rbac/router-level guards.
- **Frontend** (new helper `src/utils/roles.js`):
  - `Customers.js` — Edit button shown for data_entry; "View Only" label only for support.
  - `Leads.js` — "+ Add Lead" and per-row "Update" buttons now visible to data_entry.
  - `SalesInvoices.js` — "+ New Invoice", "Import from Excel", per-row Edit/Delete now visible to data_entry.
  - `Payments.js` — "+ Record Payment" now visible to data_entry.
  - `ProductFilters.js` and `ProductTable.js` — Add/Import/Export and per-row Edit now visible to data_entry.
  - "Attached pics" upload section in Product Details remains hidden for data_entry (explicit role exclusion preserved).
- **Verified**: Iteration_10 — Backend pytest 12/12 PASS, Frontend Playwright validated all 5 modules + attachment exclusion + employee regression.

### 2026-04-28 — Daily Tasks: Search & Status Filter
- **Frontend (DailyTasks.js)**: Added a search bar (matches across description, customer name, status, user name, date, and progress note text) plus a status dropdown (All / Logged / In Progress / Completed) and a live "{n} of {total}" counter. No backend changes — fully client-side.
- **Verified live**: With 5 tasks, "UITEST9" → 1 of 5; status=completed → 3 of 5.

### 2026-04-28 — Add-Progress Bug Fix (PWA Service Worker)
- **Bug**: Employee got `Uncaught: Failed to execute 'json' on 'Response': body stream already read` when adding a progress note to a Daily Task. Root cause: the PWA `service-worker.js` `fetch` handler intercepted the API POST, attempted `cache.put()` on a non-GET request which threw, and the outer `.catch()` swapped the response with the offline page — leaving the original body unread but the cloned/swapped response already consumed.
- **Fix**:
  - `service-worker.js`: skip all `/api/*`, `/ws/*`, and non-GET requests entirely (no cache, no clone, no replace). Bumped cache to `crm-cache-v2`.
  - `DailyTasks.js`: defensive `safeReadError(response)` helper reads body as text first then attempts JSON.parse, so future intermediary issues can never throw at the consumer.
  - `LocationContext.js`: gate `fetchCurrentLocations` on `localStorage.user.role` at call time (skip silently for employees + unauthenticated mounts) — removes the residual 403 console spam reported by testing.
- **Verified**: Live UI run logs in two consecutive progress notes and "Mark Complete" on a fresh task without any uncaught errors.

### 2026-04-28 — Daily Tasks: Customer Link + Progress Notes + Close
- **Model**: Added `customer_id`, `customer_name`, `progress_notes: List[ProgressNote]` to `DailyTask`. Added `ProgressNote` ({note, timestamp}) and `ProgressNoteCreate` models.
- **Backend endpoints**:
  - `GET /api/daily-tasks/customers` — lightweight `{id, name}` list (employees/admins only).
  - `POST /api/daily-tasks/{id}/progress` — append timestamped note; auto-sets status to `in_progress`.
  - `POST /api/daily-tasks/{id}/close` — set status `completed`; subsequent edits/progress return 409.
  - `POST/PUT /api/daily-tasks` now hydrate `customer_name` from DB when `customer_id` is provided; reject invalid IDs with 400.
- **Frontend (DailyTasks.js)**:
  - Customer dropdown in form (calls new lightweight endpoint).
  - Per-card "Add Progress" textarea + "Mark Complete" button (with confirm).
  - Progress notes rendered with timestamps.
  - When `status==='completed'`: edit/progress UI removed, "Task is closed and locked from edits" indicator shown.
- **Verified**: Backend 11/11 PASS (iteration_9 pytest at `/app/backend/tests/test_daily_tasks_iter9.py`); Frontend visually validated end-to-end.

### 2026-04-28 — Employee RBAC Hardening + WebSocket Path Fix
- **Backend**: Added `block_employee` dependency in `rbac.py` and applied it as router-level guard on 12 modules (customer, product, lead, sales, payment, activity, team, user, dashboard, geofence, master_data, location). Employees now receive 403 on all non-daily-task endpoints. Verified 40/40 pytest cases (iteration_7).
- **Backend**: Moved WebSocket endpoint from `/ws/locations` to `/api/ws/locations` so K8s ingress (which only forwards `/api/*` to backend) can route it. Verified `wss://…/api/ws/locations` connects.
- **Frontend**: `ProtectedRoute` now accepts `allowEmployee` prop; only `/daily-tasks` allows employees, all other routes auto-redirect them. `RoleAwareDefault` for `/` and `*`. `Login.js` and `PublicRoute` send employees to `/daily-tasks`, others to `/dashboard`. Verified 7/7 frontend tests (iteration_8).
- **Frontend**: Geolocation errors downgraded from `console.error` → `console.warn` (LocationContext + locationTracking). LocationContext + AuthContext now skip location polling/WS/tracking entirely for `role==='employee'` to keep the console clean.

### 2026-04-28 — P0 Login Bug + P1 Role Restrictions
- **Fixed**: passlib/bcrypt version incompatibility. Replaced `passlib.CryptContext` with direct `bcrypt.checkpw` / `bcrypt.hashpw` (with 72-byte truncation) in `backend/auth.py`. Updated `routes/user_routes.py` admin-reset path to use the shared helper.
- **Fixed**: Reset password hashes for `admin@zartecsolutions.com`, `rajesh@zartecsolutions.com`. Created `dataentry@test.com` and `employee@test.com` (all `admin123`).
- **Implemented**: data_entry role hides "Attachments" upload section in Product Details modal (`ProductsEnhanced.js`).
- **Verified**: Backend tests 15/15 PASS (login + RBAC). Frontend tests 3/3 PASS (admin sees attachments, data_entry doesn't, Assign Serials still admin-only).

### Earlier in this Project
- White-label branding via env vars; removed Made-with-Emergent watermark.
- Built Daily Tasks full-stack module (`backend/routes/daily_task_routes.py`, `backend/models/daily_task_models.py`, `frontend/src/pages/DailyTasks.js`).
- Added `data_entry` and `employee` roles across User models, RBAC, sidebar navigation.
- Mobile UI fixes (back-to-dashboard, create-activity button, profile dropdown).
- Refactored 5 high-complexity backend functions into `backend/utils/`.
- Created `/api/download/project-zip` for project export.
- Fixed React `key={index}` warnings across 5 files.

## Roadmap

### P1 Backlog
- AWS S3 integration for file/image storage (replace base64/local).
- Tighten employee API access — currently relies on frontend nav restriction; backend should also block employees from non-daily-task endpoints.
- Resolve WebSocket `/ws/locations` 403/404 errors and graceful Geolocation fallback (noted in iteration_6 testing).

### P2 Backlog
- Refactor oversized files: `ExcelImport.jsx` (519), `ProductsEnhanced.js` (1183), `CompanySettings.js` (627). Consolidate `Products.js` vs `ProductsEnhanced.js` (only one is rendered — `ProductsEnhanced.js`).
- Extract business logic from routes into `backend/services/` layer.

## Test Credentials
See `/app/memory/test_credentials.md` (kept current).

## 3rd-Party Integrations
- OpenStreetMap Nominatim (free, user-provided)
- Chart.js (UI viz)
