"""Iteration 9: Daily Tasks customer dropdown + progress notes + close flow."""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dept-action-crm-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CRED = {
    "employee_rajesh": ("rajesh@zartecsolutions.com", "admin123"),
    "employee_test":   ("employee@test.com", "admin123"),
    "admin":           ("admin@test.com", "admin123"),
    # Two data-entry accounts exist; try both until one works
    "data_entry":      [("admin@zartecsolutions.com", "admin123"),
                        ("dataentry@test.com", "admin123")],
    "sales":           ("agent@test.com", "agent123"),
}

def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    if r.status_code != 200:
        return None
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def tokens():
    out = {}
    for k, v in CRED.items():
        if isinstance(v, list):
            tok = None
            for em, pw in v:
                tok = _login(em, pw)
                if tok:
                    break
            out[k] = tok
        else:
            out[k] = _login(*v)
    return out


def H(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# ----- Customer dropdown access -----
class TestCustomerDropdown:
    def test_employee_rajesh_200(self, tokens):
        r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["employee_rajesh"]), timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        c = data[0]
        assert "id" in c and "name" in c

    def test_employee_test_200(self, tokens):
        r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["employee_test"]), timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_200(self, tokens):
        r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["admin"]), timeout=20)
        assert r.status_code == 200

    def test_data_entry_403(self, tokens):
        if not tokens["data_entry"]:
            pytest.skip("No data_entry credentials worked")
        r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["data_entry"]), timeout=20)
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"

    def test_sales_403(self, tokens):
        if not tokens["sales"]:
            pytest.skip("sales login failed")
        r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["sales"]), timeout=20)
        assert r.status_code == 403


# ----- Create with customer_id -----
@pytest.fixture(scope="module")
def first_customer(tokens):
    r = requests.get(f"{API}/daily-tasks/customers", headers=H(tokens["employee_rajesh"]), timeout=20)
    return r.json()[0]


class TestCreateProgressClose:
    created_id = None

    def test_create_with_customer_id_hydrates_name(self, tokens, first_customer):
        payload = {
            "task_date": date.today().isoformat(),
            "task_description": "TEST_iter9 daily task",
            "hours_spent": 1.5,
            "status": "logged",
            "customer_id": first_customer["id"],
        }
        r = requests.post(f"{API}/daily-tasks", headers=H(tokens["employee_rajesh"]), json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["customer_id"] == first_customer["id"]
        assert data["customer_name"] == first_customer["name"]
        assert data["progress_notes"] == []
        TestCreateProgressClose.created_id = data["id"]

    def test_create_with_invalid_customer_id_400(self, tokens):
        payload = {
            "task_date": date.today().isoformat(),
            "task_description": "TEST_iter9 invalid cust",
            "hours_spent": 1.0,
            "status": "logged",
            "customer_id": "does-not-exist-xyz",
        }
        r = requests.post(f"{API}/daily-tasks", headers=H(tokens["employee_rajesh"]), json=payload, timeout=20)
        assert r.status_code == 400, r.text

    def test_add_progress_note_sets_in_progress(self, tokens):
        tid = TestCreateProgressClose.created_id
        assert tid
        r = requests.post(f"{API}/daily-tasks/{tid}/progress",
                          headers=H(tokens["employee_rajesh"]),
                          json={"note": "Started working on the customer call"}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "in_progress"
        assert len(data["progress_notes"]) == 1
        n = data["progress_notes"][0]
        assert n["note"] == "Started working on the customer call"
        assert "timestamp" in n and n["timestamp"]

    def test_other_employee_progress_403(self, tokens):
        tid = TestCreateProgressClose.created_id
        r = requests.post(f"{API}/daily-tasks/{tid}/progress",
                          headers=H(tokens["employee_test"]),
                          json={"note": "should not be allowed"}, timeout=20)
        assert r.status_code == 403, r.text

    def test_close_task_sets_completed(self, tokens):
        tid = TestCreateProgressClose.created_id
        r = requests.post(f"{API}/daily-tasks/{tid}/close",
                          headers=H(tokens["employee_rajesh"]), timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "completed"

    def test_put_after_close_409(self, tokens):
        tid = TestCreateProgressClose.created_id
        r = requests.put(f"{API}/daily-tasks/{tid}",
                         headers=H(tokens["employee_rajesh"]),
                         json={"task_description": "edit after close"}, timeout=20)
        assert r.status_code == 409, r.text

    def test_progress_after_close_409(self, tokens):
        tid = TestCreateProgressClose.created_id
        r = requests.post(f"{API}/daily-tasks/{tid}/progress",
                          headers=H(tokens["employee_rajesh"]),
                          json={"note": "after close"}, timeout=20)
        assert r.status_code == 409, r.text
