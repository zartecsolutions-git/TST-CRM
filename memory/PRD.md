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
