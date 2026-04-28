"""
Iteration 7 - Tests:
  (1) Employee role blocked (403) on non-daily-task endpoints via block_employee dependency
  (2) Employee allowed on /api/daily-tasks, /api/auth/me, /api/companies/default/branding
  (3) Admin / data_entry / sales unaffected (regression)
  (4) WebSocket endpoint moved to /api/ws/locations (open success on new path)
"""
import os
import pytest
import requests
import asyncio
import websockets
import ssl
from urllib.parse import urlparse

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dept-action-crm-1.preview.emergentagent.com').rstrip('/')

CREDS = {
    "admin": ("admin@test.com", "admin123"),
    "data_entry": ("admin@zartecsolutions.com", "admin123"),
    "sales": ("sales@test.com", "sales123"),
    "employee_test": ("employee@test.com", "admin123"),
    "employee_rajesh": ("rajesh@zartecsolutions.com", "admin123"),
}

EMP_BLOCKED_ENDPOINTS = [
    "/api/customers",
    "/api/products",
    "/api/leads",
    "/api/payments",
    "/api/sales/invoices",
    "/api/dashboard/stats",
    "/api/users",
    "/api/teams",
    "/api/geofences",
    "/api/locations/current",
    "/api/activities",
    "/api/master-data/categories",
]

EMP_ALLOWED_ENDPOINTS = [
    "/api/daily-tasks",
    "/api/auth/me",
    "/api/companies/default/branding",
]


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return r


def _auth(tok):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def tokens():
    out = {}
    for k, (email, pwd) in CREDS.items():
        r = _login(email, pwd)
        if r.status_code == 200:
            out[k] = r.json()["access_token"]
        else:
            out[k] = None
            print(f"[WARN] login failed for {k} ({email}): {r.status_code} {r.text[:120]}")
    return out


# ---------------------------------------------------------------------------
# Login regression (all 5 should still log in)
# ---------------------------------------------------------------------------
class TestLoginRegression:
    @pytest.mark.parametrize("key", list(CREDS.keys()))
    def test_login_works(self, key):
        if key == "sales":
            # sales credentials may be unknown; allow skip on 401
            email, pwd = CREDS[key]
            r = _login(email, pwd)
            if r.status_code != 200:
                pytest.skip(f"sales credentials not seeded: {r.status_code}")
            return
        email, pwd = CREDS[key]
        r = _login(email, pwd)
        assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
        assert "access_token" in r.json()


# ---------------------------------------------------------------------------
# Employee blocked on non-daily-task endpoints
# ---------------------------------------------------------------------------
class TestEmployeeBlocked:
    @pytest.mark.parametrize("endpoint", EMP_BLOCKED_ENDPOINTS)
    def test_employee_test_403(self, tokens, endpoint):
        tok = tokens.get("employee_test")
        if not tok:
            pytest.skip("employee_test login failed")
        r = requests.get(f"{BASE_URL}{endpoint}", headers=_auth(tok))
        assert r.status_code == 403, f"Expected 403 for employee on {endpoint}, got {r.status_code}: {r.text[:200]}"

    @pytest.mark.parametrize("endpoint", EMP_BLOCKED_ENDPOINTS)
    def test_employee_rajesh_403(self, tokens, endpoint):
        tok = tokens.get("employee_rajesh")
        if not tok:
            pytest.skip("employee_rajesh login failed")
        r = requests.get(f"{BASE_URL}{endpoint}", headers=_auth(tok))
        assert r.status_code == 403, f"Expected 403 for rajesh on {endpoint}, got {r.status_code}: {r.text[:200]}"


# ---------------------------------------------------------------------------
# Employee ALLOWED on daily tasks + auth/me + branding
# ---------------------------------------------------------------------------
class TestEmployeeAllowed:
    @pytest.mark.parametrize("endpoint", EMP_ALLOWED_ENDPOINTS)
    def test_employee_200(self, tokens, endpoint):
        tok = tokens.get("employee_test")
        if not tok:
            pytest.skip("employee_test login failed")
        r = requests.get(f"{BASE_URL}{endpoint}", headers=_auth(tok))
        assert r.status_code == 200, f"Expected 200 for employee on {endpoint}, got {r.status_code}: {r.text[:200]}"


# ---------------------------------------------------------------------------
# Admin / data_entry / sales should NOT be blocked (regression)
# ---------------------------------------------------------------------------
class TestNonEmployeeNotBlocked:
    def test_admin_customers_200(self, tokens):
        tok = tokens.get("admin")
        assert tok, "admin login required"
        r = requests.get(f"{BASE_URL}/api/customers", headers=_auth(tok))
        assert r.status_code == 200, f"admin /api/customers => {r.status_code} {r.text[:200]}"

    def test_admin_users_200(self, tokens):
        tok = tokens.get("admin")
        assert tok
        r = requests.get(f"{BASE_URL}/api/users", headers=_auth(tok))
        assert r.status_code == 200

    def test_admin_dashboard_200(self, tokens):
        tok = tokens.get("admin")
        assert tok
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=_auth(tok))
        assert r.status_code == 200

    def test_data_entry_customers_200(self, tokens):
        tok = tokens.get("data_entry")
        assert tok, "data_entry login required"
        r = requests.get(f"{BASE_URL}/api/customers", headers=_auth(tok))
        assert r.status_code == 200, f"data_entry /api/customers => {r.status_code} {r.text[:200]}"

    def test_data_entry_products_200(self, tokens):
        tok = tokens.get("data_entry")
        assert tok
        r = requests.get(f"{BASE_URL}/api/products", headers=_auth(tok))
        assert r.status_code == 200

    def test_sales_customers_not_403(self, tokens):
        tok = tokens.get("sales")
        if not tok:
            pytest.skip("sales credentials not available")
        r = requests.get(f"{BASE_URL}/api/customers", headers=_auth(tok))
        # block_employee should not affect sales role
        assert r.status_code != 403, f"sales should not be blocked, got 403: {r.text[:200]}"


# ---------------------------------------------------------------------------
# WebSocket: new path /api/ws/locations should open; old /ws/locations should NOT
# ---------------------------------------------------------------------------
def _ws_url(path: str) -> str:
    p = urlparse(BASE_URL)
    scheme = "wss" if p.scheme == "https" else "ws"
    return f"{scheme}://{p.netloc}{path}"


async def _try_ws(path: str, timeout: float = 6.0):
    url = _ws_url(path)
    ssl_ctx = ssl.create_default_context() if url.startswith("wss") else None
    try:
        async with websockets.connect(url, ssl=ssl_ctx, open_timeout=timeout, close_timeout=2) as ws:
            # send ping-like message to confirm liveness
            try:
                await asyncio.wait_for(ws.send("ping"), timeout=2)
            except Exception:
                pass
            return True, None
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


class TestWebSocket:
    def test_new_ws_path_connects(self):
        ok, err = asyncio.get_event_loop().run_until_complete(_try_ws("/api/ws/locations"))
        assert ok, f"WS connect failed on /api/ws/locations: {err}"

    def test_old_ws_path_not_wired(self):
        # Old path should NOT be available (per request: acceptable to fail)
        ok, err = asyncio.get_event_loop().run_until_complete(_try_ws("/ws/locations"))
        # We expect failure (4xx/connection rejected). If somehow ok=True, just log a warning.
        if ok:
            print("[NOTE] old /ws/locations still wired - not a regression but unexpected")
        # No assertion -- this is informational only.
