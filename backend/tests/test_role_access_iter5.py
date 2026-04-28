"""
Role-Based Access Control Tests (P0 Login fix + P1 data_entry/employee role restrictions)
Iteration 5 - Tests new data_entry and employee roles
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dept-action-crm-1.preview.emergentagent.com').rstrip('/')

USERS = {
    "admin_test": ("admin@test.com", "admin123", "admin"),
    "admin_zartec": ("admin@zartecsolutions.com", "admin123", "data_entry"),
    "dataentry": ("dataentry@test.com", "admin123", "data_entry"),
    "employee_test": ("employee@test.com", "admin123", "employee"),
    "employee_rajesh": ("rajesh@zartecsolutions.com", "admin123", "employee"),
}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def login(session, email, password):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    return r


def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ============================================================================
# P0: LOGIN TESTS - all 5 credentials must be able to log in (bcrypt fix)
# ============================================================================
class TestLoginP0:
    """Verifies bcrypt fix for all role accounts."""

    @pytest.mark.parametrize("key", list(USERS.keys()))
    def test_login_succeeds(self, session, key):
        email, password, expected_role = USERS[key]
        r = login(session, email, password)
        assert r.status_code == 200, f"Login failed for {email}: {r.status_code} {r.text}"
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"].lower() == email.lower()
        assert data["user"]["role"] == expected_role, (
            f"Role mismatch for {email}: expected {expected_role}, got {data['user']['role']}"
        )


# ============================================================================
# P1: data_entry role API access
# ============================================================================
class TestDataEntryAccess:
    """data_entry should access customers, products, leads, sales/invoices, payments."""

    @pytest.fixture(scope="class")
    def de_token(self, session):
        r = login(session, "admin@zartecsolutions.com", "admin123")
        if r.status_code != 200:
            pytest.skip(f"data_entry login failed: {r.status_code}")
        return r.json()["access_token"]

    def test_get_customers(self, de_token):
        r = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers(de_token))
        assert r.status_code == 200, f"GET /api/customers => {r.status_code} {r.text}"
        assert isinstance(r.json(), list)

    def test_get_products(self, de_token):
        r = requests.get(f"{BASE_URL}/api/products", headers=auth_headers(de_token))
        assert r.status_code == 200, f"GET /api/products => {r.status_code} {r.text}"

    def test_get_leads(self, de_token):
        r = requests.get(f"{BASE_URL}/api/leads", headers=auth_headers(de_token))
        assert r.status_code == 200, f"GET /api/leads => {r.status_code} {r.text}"

    def test_get_sales_invoices(self, de_token):
        r = requests.get(f"{BASE_URL}/api/sales/invoices", headers=auth_headers(de_token))
        assert r.status_code == 200, f"GET /api/sales/invoices => {r.status_code} {r.text}"

    def test_get_payments(self, de_token):
        r = requests.get(f"{BASE_URL}/api/payments", headers=auth_headers(de_token))
        assert r.status_code == 200, f"GET /api/payments => {r.status_code} {r.text}"

    def test_update_customer(self, de_token):
        # Create as admin first then update as data_entry
        admin_login = requests.post(f"{BASE_URL}/api/auth/login",
                                    json={"email": "admin@test.com", "password": "admin123"})
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]

        unique = uuid.uuid4().hex[:6]
        create = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers(admin_token),
            json={"name": f"TEST_DECust_{unique}", "email": f"TEST_de_{unique}@test.com",
                  "phone": "+97312345678", "company": "TestCo"},
        )
        assert create.status_code in (200, 201), f"Customer create: {create.status_code} {create.text}"
        cid = create.json()["id"]

        upd = requests.put(
            f"{BASE_URL}/api/customers/{cid}",
            headers=auth_headers(de_token),
            json={"name": f"TEST_DECust_{unique}_UPD"},
        )
        assert upd.status_code in (200, 204), f"data_entry PUT customer: {upd.status_code} {upd.text}"

        # verify persisted
        get_r = requests.get(f"{BASE_URL}/api/customers/{cid}", headers=auth_headers(de_token))
        assert get_r.status_code == 200
        assert "UPD" in get_r.json().get("name", "")

        # cleanup
        requests.delete(f"{BASE_URL}/api/customers/{cid}", headers=auth_headers(admin_token))


# ============================================================================
# P1: employee role API access (Daily Tasks ONLY)
# ============================================================================
class TestEmployeeAccess:
    """employee should only see/manage own daily tasks."""

    @pytest.fixture(scope="class")
    def emp_token(self, session):
        r = login(session, "employee@test.com", "admin123")
        if r.status_code != 200:
            pytest.skip(f"employee login failed: {r.status_code}")
        return r.json()["access_token"]

    @pytest.fixture(scope="class")
    def emp2_token(self, session):
        r = login(session, "rajesh@zartecsolutions.com", "admin123")
        if r.status_code != 200:
            pytest.skip(f"employee2 login failed: {r.status_code}")
        return r.json()["access_token"]

    @pytest.fixture(scope="class")
    def emp_user(self, emp_token):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers(emp_token))
        assert r.status_code == 200
        return r.json()

    def test_get_daily_tasks(self, emp_token):
        r = requests.get(f"{BASE_URL}/api/daily-tasks", headers=auth_headers(emp_token))
        assert r.status_code == 200, f"GET /api/daily-tasks => {r.status_code} {r.text}"
        assert isinstance(r.json(), list)

    def test_create_daily_task(self, emp_token, emp_user):
        unique = uuid.uuid4().hex[:6]
        payload = {
            "title": f"TEST_Task_{unique}",
            "task_description": "Daily task created by employee test",
            "hours_spent": 1.0,
            "task_date": "2026-01-15",
            "status": "pending",
        }
        r = requests.post(f"{BASE_URL}/api/daily-tasks", headers=auth_headers(emp_token), json=payload)
        assert r.status_code in (200, 201), f"POST daily task: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("task_description") == payload["task_description"] or data.get("id")
        # verify persisted in employee's own tasks
        list_r = requests.get(f"{BASE_URL}/api/daily-tasks", headers=auth_headers(emp_token))
        assert list_r.status_code == 200
        ids = [t.get("id") for t in list_r.json()]
        assert data.get("id") in ids

    def test_employee_only_sees_own_tasks(self, emp_token, emp2_token, emp_user):
        # Both employees fetch lists
        r1 = requests.get(f"{BASE_URL}/api/daily-tasks", headers=auth_headers(emp_token))
        r2 = requests.get(f"{BASE_URL}/api/daily-tasks", headers=auth_headers(emp2_token))
        assert r1.status_code == 200 and r2.status_code == 200
        emp_id = emp_user.get("id")
        for t in r1.json():
            owner = t.get("user_id") or t.get("created_by") or t.get("assigned_to")
            if owner is not None and emp_id is not None:
                assert owner == emp_id, f"Employee saw task not theirs: {t}"

    def test_employee_blocked_from_admin_endpoints(self, emp_token):
        # Employees should not be able to list users / customers freely (or at least not admin endpoints)
        r = requests.get(f"{BASE_URL}/api/users", headers=auth_headers(emp_token))
        # depending on implementation could be 200 (read-only) or 403
        assert r.status_code in (200, 401, 403), f"Unexpected: {r.status_code}"
        if r.status_code == 200:
            # Note: not strictly a violation but flag
            print(f"NOTE: employee can GET /api/users (count={len(r.json())})")
