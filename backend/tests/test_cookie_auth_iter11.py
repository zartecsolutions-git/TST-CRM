"""Iteration 11 - httpOnly cookie auth migration regression tests.

Covers:
  - POST /api/auth/login sets HttpOnly + SameSite=Lax + Secure auth_token cookie
  - GET /api/auth/me works with cookie-only, header-only, and rejects no-auth
  - Bearer null is ignored; cookie wins when both present
  - POST /api/auth/logout clears the cookie
  - Regression: data_entry/employee role gating still works through cookie path
"""
import os
import re
import requests
import pytest
from pathlib import Path


def _load_backend_url():
    url = os.environ.get('REACT_APP_BACKEND_URL')
    if url:
        return url.rstrip('/')
    env_path = Path('/app/frontend/.env')
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith('REACT_APP_BACKEND_URL='):
                return line.split('=', 1)[1].strip().rstrip('/')
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")


BASE_URL = _load_backend_url()

ADMIN = {"email": "admin@test.com", "password": "admin123"}
DATA_ENTRY = {"email": "admin@zartecsolutions.com", "password": "admin123"}
EMPLOYEE = {"email": "rajesh@zartecsolutions.com", "password": "admin123"}


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds)
    return s, r


# ---------- Cookie issuance ----------
class TestLoginCookie:
    def test_login_sets_httponly_cookie(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body and body["access_token"]
        assert body["user"]["email"] == ADMIN["email"]

        # Cookie present in jar
        assert "auth_token" in r.cookies, f"auth_token cookie missing; got {dict(r.cookies)}"

        # Inspect raw Set-Cookie header for HttpOnly + SameSite=Lax + Secure
        set_cookie = r.headers.get("set-cookie", "") or ""
        # requests collapses multiple Set-Cookie into one comma-joined string
        assert "auth_token=" in set_cookie
        assert re.search(r"HttpOnly", set_cookie, re.I), f"HttpOnly missing: {set_cookie}"
        assert re.search(r"SameSite=Lax", set_cookie, re.I), f"SameSite=Lax missing: {set_cookie}"
        assert re.search(r"Secure", set_cookie, re.I), f"Secure missing: {set_cookie}"
        assert re.search(r"Path=/", set_cookie, re.I), f"Path=/ missing: {set_cookie}"


# ---------- /me extraction matrix ----------
class TestMeExtraction:
    def test_me_with_cookie_only(self):
        s, r = _login(ADMIN)
        assert r.status_code == 200
        # Strip Authorization header path: requests session has none by default
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200, me.text
        assert me.json()["email"] == ADMIN["email"]

    def test_me_with_bearer_only(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
        token = r.json()["access_token"]
        # Use a clean session so cookie does NOT leak in
        me = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me.status_code == 200, me.text
        assert me.json()["email"] == ADMIN["email"]

    def test_me_no_auth_returns_401(self):
        me = requests.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 401

    def test_me_bearer_null_returns_401(self):
        me = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer null"},
        )
        assert me.status_code == 401

    def test_me_bearer_null_with_valid_cookie_returns_200(self):
        s, r = _login(ADMIN)
        assert r.status_code == 200
        me = s.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer null"},
        )
        assert me.status_code == 200, me.text
        assert me.json()["email"] == ADMIN["email"]


# ---------- Logout ----------
class TestLogout:
    def test_logout_clears_cookie(self):
        s, r = _login(ADMIN)
        assert r.status_code == 200
        assert "auth_token" in s.cookies

        out = s.post(f"{BASE_URL}/api/auth/logout")
        assert out.status_code == 200, out.text

        # Set-Cookie on logout response should expire/clear cookie
        set_cookie = out.headers.get("set-cookie", "") or ""
        assert "auth_token=" in set_cookie, f"No clearing Set-Cookie header: {out.headers}"
        # Either Max-Age=0 or expires in the past
        cleared = re.search(r"Max-Age=0", set_cookie, re.I) or re.search(
            r"expires=.*1970", set_cookie, re.I
        )
        assert cleared, f"auth_token not invalidated: {set_cookie}"

        # Cookie should be gone from jar (or empty)
        post_logout_cookie = s.cookies.get("auth_token")
        assert not post_logout_cookie, f"cookie still present: {post_logout_cookie}"

        # /me without cookie now 401
        me = requests.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 401

    def test_logout_without_auth_returns_401(self):
        out = requests.post(f"{BASE_URL}/api/auth/logout")
        assert out.status_code == 401


# ---------- Role regression via cookie ----------
class TestRoleRegressionViaCookie:
    def test_data_entry_login_via_cookie(self):
        s, r = _login(DATA_ENTRY)
        assert r.status_code == 200, r.text
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        assert me.json()["role"] == "data_entry"
        # Customers list reachable for data_entry through cookie
        cust = s.get(f"{BASE_URL}/api/customers")
        assert cust.status_code == 200, cust.text

    def test_employee_login_via_cookie_and_blocked_from_customers(self):
        s, r = _login(EMPLOYEE)
        assert r.status_code == 200, r.text
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        assert me.json()["role"] == "employee"
        # Employee should be blocked from /customers (RBAC regression)
        cust = s.get(f"{BASE_URL}/api/customers")
        assert cust.status_code in (401, 403), f"employee got {cust.status_code} on /customers"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
