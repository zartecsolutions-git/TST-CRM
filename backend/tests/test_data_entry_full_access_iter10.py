"""
Iteration 10 - data_entry FULL ACCESS regression
Verifies data_entry users can POST/PUT/DELETE on Customers, Products,
Sales Invoices, Payments, Leads while employee remains 403 and admin
regression still passes.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    'REACT_APP_BACKEND_URL', 'https://dept-action-crm-1.preview.emergentagent.com'
).rstrip('/')

CREDS = {
    "data_entry": ("admin@zartecsolutions.com", "admin123"),
    "data_entry_alt": ("dataentry@test.com", "admin123"),
    "admin": ("admin@test.com", "admin123"),
    "employee": ("rajesh@zartecsolutions.com", "admin123"),
    "sales": ("agent@test.com", "agent123"),
}


def _login(email, pwd):
    return requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd})


def _h(tok):
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def tokens():
    out = {}
    for k, (e, p) in CREDS.items():
        r = _login(e, p)
        out[k] = r.json().get("access_token") if r.status_code == 200 else None
        if not out[k]:
            print(f"[WARN] {k} login {r.status_code} {r.text[:120]}")
    return out


@pytest.fixture(scope="module")
def existing_customer_id(tokens):
    """Pick any existing customer for lead creation / invoice creation."""
    tok = tokens.get("admin") or tokens.get("data_entry")
    assert tok, "need admin/data_entry token"
    r = requests.get(f"{BASE_URL}/api/customers", headers=_h(tok))
    assert r.status_code == 200, r.text
    items = r.json()
    if not items:
        pytest.skip("No existing customers seeded")
    return items[0]["id"]


# --------------------------------------------------------------------------
# CUSTOMERS - data_entry full CRUD
# --------------------------------------------------------------------------
class TestDataEntryCustomers:
    def test_post_put_delete(self, tokens):
        tok = tokens.get("data_entry")
        assert tok, "data_entry login required"
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_iter10 Cust {suffix}",
            "email": f"test_iter10_{suffix}@example.com",
            "phone": "+1234567890",
            "address": "Test 123",
            "city": "Manama",
        }
        r = requests.post(f"{BASE_URL}/api/customers", headers=_h(tok), json=payload)
        assert r.status_code == 200, f"POST customers => {r.status_code} {r.text[:200]}"
        cid = r.json()["id"]

        # PUT
        r2 = requests.put(
            f"{BASE_URL}/api/customers/{cid}", headers=_h(tok),
            json={"region": "Doha"}
        )
        assert r2.status_code == 200, f"PUT => {r2.status_code} {r2.text[:200]}"
        assert r2.json()["region"] == "Doha"

        # GET to verify persistence
        r3 = requests.get(f"{BASE_URL}/api/customers/{cid}", headers=_h(tok))
        assert r3.status_code == 200 and r3.json()["region"] == "Doha"

        # DELETE
        r4 = requests.delete(f"{BASE_URL}/api/customers/{cid}", headers=_h(tok))
        assert r4.status_code == 200, f"DELETE => {r4.status_code} {r4.text[:200]}"

        # 404 after delete
        r5 = requests.get(f"{BASE_URL}/api/customers/{cid}", headers=_h(tok))
        assert r5.status_code == 404


# --------------------------------------------------------------------------
# PRODUCTS - data_entry full CRUD
# --------------------------------------------------------------------------
class TestDataEntryProducts:
    def test_post_put_delete(self, tokens):
        tok = tokens.get("data_entry")
        assert tok
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_iter10 Prod {suffix}",
            "part_number": f"TIP-{suffix}",
            "category": "TestCat",
            "price": 99.5,
            "stock_quantity": 5,
        }
        r = requests.post(f"{BASE_URL}/api/products", headers=_h(tok), json=payload)
        assert r.status_code == 200, f"POST products => {r.status_code} {r.text[:200]}"
        pid = r.json()["id"]

        r2 = requests.put(
            f"{BASE_URL}/api/products/{pid}", headers=_h(tok),
            json={"price": 150.0}
        )
        assert r2.status_code == 200, f"PUT => {r2.status_code} {r2.text[:200]}"
        assert r2.json().get("price") == 150.0

        r3 = requests.delete(f"{BASE_URL}/api/products/{pid}", headers=_h(tok))
        assert r3.status_code == 200, f"DELETE => {r3.status_code} {r3.text[:200]}"


# --------------------------------------------------------------------------
# LEADS - data_entry POST + PUT + DELETE
# --------------------------------------------------------------------------
class TestDataEntryLeads:
    def test_post_put_delete(self, tokens, existing_customer_id):
        tok = tokens.get("data_entry")
        assert tok
        suffix = uuid.uuid4().hex[:8]
        payload = {
            "customer_id": existing_customer_id,
            "lead_title": f"TEST_iter10 Lead {suffix}",
            "lead_source": "web",
            "status": "new",
            "quote_value": 500.0,
        }
        r = requests.post(f"{BASE_URL}/api/leads", headers=_h(tok), json=payload)
        assert r.status_code == 200, f"POST leads => {r.status_code} {r.text[:200]}"
        lid = r.json()["id"]

        r2 = requests.put(
            f"{BASE_URL}/api/leads/{lid}", headers=_h(tok),
            json={"status": "qualified", "update_note": "iter10 test"}
        )
        assert r2.status_code == 200, f"PUT leads => {r2.status_code} {r2.text[:200]}"

        r3 = requests.delete(f"{BASE_URL}/api/leads/{lid}", headers=_h(tok))
        assert r3.status_code == 200, f"DELETE leads => {r3.status_code} {r3.text[:200]}"


# --------------------------------------------------------------------------
# SALES INVOICES - data_entry POST + PUT + DELETE
# --------------------------------------------------------------------------
class TestDataEntrySalesInvoices:
    def test_post_put_delete(self, tokens, existing_customer_id):
        tok = tokens.get("data_entry")
        assert tok
        # fetch customer details for name
        cust = requests.get(
            f"{BASE_URL}/api/customers/{existing_customer_id}", headers=_h(tok)
        ).json()
        suffix = uuid.uuid4().hex[:8]
        invoice_number = f"TEST-INV-{suffix}"
        payload = {
            "invoice_number": invoice_number,
            "invoice_date": "2026-01-15",
            "customer_id": existing_customer_id,
            "customer_name": cust.get("name", "TestCust"),
            "sales_rep_id": "data-entry-id",
            "sales_rep_name": "Jeena",
            "items": [{
                "product_name": "iter10 Item",
                "part_number": "PN-1",
                "category": "Cat",
                "quantity": 2.0,
                "unit_price": 50.0,
                "total": 100.0,
            }],
            "subtotal": 100.0,
            "vat_percentage": 10.0,
            "vat_amount": 10.0,
            "total_amount": 110.0,
            "payment_status": "Pending",
        }
        r = requests.post(f"{BASE_URL}/api/sales/invoices", headers=_h(tok), json=payload)
        assert r.status_code == 200, f"POST invoice => {r.status_code} {r.text[:200]}"

        r2 = requests.put(
            f"{BASE_URL}/api/sales/invoices/{invoice_number}", headers=_h(tok),
            json={"notes": "Updated by data_entry"}
        )
        assert r2.status_code == 200, f"PUT invoice => {r2.status_code} {r2.text[:200]}"

        r3 = requests.delete(
            f"{BASE_URL}/api/sales/invoices/{invoice_number}", headers=_h(tok)
        )
        assert r3.status_code == 200, f"DELETE invoice => {r3.status_code} {r3.text[:200]}"


# --------------------------------------------------------------------------
# PAYMENTS - data_entry POST + PUT + DELETE
# --------------------------------------------------------------------------
class TestDataEntryPayments:
    def test_post_put_delete(self, tokens, existing_customer_id):
        tok = tokens.get("data_entry")
        assert tok
        cust = requests.get(
            f"{BASE_URL}/api/customers/{existing_customer_id}", headers=_h(tok)
        ).json()
        suffix = uuid.uuid4().hex[:8]
        invoice_number = f"TEST-PAY-{suffix}"
        # need an invoice first
        inv_payload = {
            "invoice_number": invoice_number,
            "invoice_date": "2026-01-15",
            "customer_id": existing_customer_id,
            "customer_name": cust.get("name", "TestCust"),
            "sales_rep_id": "data-entry-id",
            "sales_rep_name": "Jeena",
            "items": [{
                "product_name": "Pay Item",
                "quantity": 1.0,
                "unit_price": 200.0,
                "total": 200.0,
            }],
            "subtotal": 200.0,
            "vat_percentage": 10.0,
            "vat_amount": 20.0,
            "total_amount": 220.0,
            "payment_status": "Pending",
        }
        ri = requests.post(f"{BASE_URL}/api/sales/invoices", headers=_h(tok), json=inv_payload)
        assert ri.status_code == 200, f"setup invoice => {ri.status_code} {ri.text[:200]}"

        payment_payload = {
            "invoice_number": invoice_number,
            "customer_name": cust.get("name", "TestCust"),
            "invoice_amount": 220.0,
            "received_amount": 100.0,
            "balance_amount": 120.0,
            "payment_mode": "Cash",
            "received_date": "2026-01-15",
            "payment_status": "Partially Paid",
        }
        r = requests.post(f"{BASE_URL}/api/payments", headers=_h(tok), json=payment_payload)
        assert r.status_code == 200, f"POST payment => {r.status_code} {r.text[:200]}"
        pid = r.json()["id"]

        r2 = requests.put(
            f"{BASE_URL}/api/payments/{pid}", headers=_h(tok),
            json={"received_amount": 220.0, "balance_amount": 0.0, "payment_status": "Paid"}
        )
        assert r2.status_code == 200, f"PUT payment => {r2.status_code} {r2.text[:200]}"

        r3 = requests.delete(f"{BASE_URL}/api/payments/{pid}", headers=_h(tok))
        assert r3.status_code == 200, f"DELETE payment => {r3.status_code} {r3.text[:200]}"

        # cleanup invoice
        requests.delete(f"{BASE_URL}/api/sales/invoices/{invoice_number}", headers=_h(tok))


# --------------------------------------------------------------------------
# Regression: employee blocked, admin allowed, sales for customers/leads
# --------------------------------------------------------------------------
class TestRegression:
    def test_employee_blocked_post_customer(self, tokens):
        tok = tokens.get("employee")
        if not tok:
            pytest.skip("employee not seeded")
        r = requests.post(
            f"{BASE_URL}/api/customers", headers=_h(tok),
            json={"name": "x", "email": "x@x.com", "phone": "1"}
        )
        assert r.status_code == 403, f"employee should be 403, got {r.status_code}"

    def test_employee_blocked_post_lead(self, tokens):
        tok = tokens.get("employee")
        if not tok:
            pytest.skip("employee not seeded")
        r = requests.post(
            f"{BASE_URL}/api/leads", headers=_h(tok),
            json={"customer_id": "x", "lead_title": "x"}
        )
        assert r.status_code == 403

    def test_admin_full_access_customer(self, tokens):
        tok = tokens.get("admin")
        assert tok
        suffix = uuid.uuid4().hex[:8]
        r = requests.post(
            f"{BASE_URL}/api/customers", headers=_h(tok),
            json={"name": f"TEST_admin {suffix}", "email": f"adm_{suffix}@x.com", "phone": "1"}
        )
        assert r.status_code == 200, r.text[:200]
        cid = r.json()["id"]
        d = requests.delete(f"{BASE_URL}/api/customers/{cid}", headers=_h(tok))
        assert d.status_code == 200

    def test_sales_customer_post(self, tokens):
        tok = tokens.get("sales")
        if not tok:
            pytest.skip("sales not seeded")
        suffix = uuid.uuid4().hex[:8]
        r = requests.post(
            f"{BASE_URL}/api/customers", headers=_h(tok),
            json={"name": f"TEST_sales {suffix}", "email": f"sl_{suffix}@x.com", "phone": "1"}
        )
        assert r.status_code == 200, r.text[:200]
        cid = r.json()["id"]
        # cleanup with admin
        atok = tokens.get("admin")
        if atok:
            requests.delete(f"{BASE_URL}/api/customers/{cid}", headers=_h(atok))


# --------------------------------------------------------------------------
# Login regression
# --------------------------------------------------------------------------
class TestLogins:
    @pytest.mark.parametrize("key", ["data_entry", "data_entry_alt", "admin", "employee"])
    def test_login(self, key):
        e, p = CREDS[key]
        r = _login(e, p)
        assert r.status_code == 200, f"{key} login failed: {r.status_code} {r.text[:120]}"
