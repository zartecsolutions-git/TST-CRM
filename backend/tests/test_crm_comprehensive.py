"""
CRM API Comprehensive Tests - Iteration 2
Tests for: Authentication, Activities (7-field search, access control), Products (CSV export, warranty),
Customers, Leads, Location Tracking (admin-only access), Dashboard
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dept-action-crm-1.preview.emergentagent.com').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"
SALES_EMAIL = "agent@test.com"
SALES_PASSWORD = "agent123"
SUPPORT_EMAIL = "client@test.com"
SUPPORT_PASSWORD = "client123"
SUPPORT2_EMAIL = "santhosh@test.com"
SUPPORT2_PASSWORD = "santhosh123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def sales_token(api_client):
    """Get sales authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": SALES_EMAIL,
        "password": SALES_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Sales authentication failed")


@pytest.fixture(scope="module")
def support_token(api_client):
    """Get support authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPPORT_EMAIL,
        "password": SUPPORT_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Support authentication failed")


@pytest.fixture(scope="module")
def support2_token(api_client):
    """Get second support user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPPORT2_EMAIL,
        "password": SUPPORT2_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Support2 authentication failed")


@pytest.fixture(scope="module")
def admin_user_id(api_client, admin_token):
    """Get admin user ID"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    response = api_client.get(f"{BASE_URL}/api/auth/me")
    api_client.headers.pop("Authorization", None)
    if response.status_code == 200:
        return response.json().get("id")
    return None


@pytest.fixture(scope="module")
def support_user_id(api_client, support_token):
    """Get support user ID"""
    api_client.headers.update({"Authorization": f"Bearer {support_token}"})
    response = api_client.get(f"{BASE_URL}/api/auth/me")
    api_client.headers.pop("Authorization", None)
    if response.status_code == 200:
        return response.json().get("id")
    return None


@pytest.fixture(scope="module")
def support2_user_id(api_client, support2_token):
    """Get support2 user ID"""
    api_client.headers.update({"Authorization": f"Bearer {support2_token}"})
    response = api_client.get(f"{BASE_URL}/api/auth/me")
    api_client.headers.pop("Authorization", None)
    if response.status_code == 200:
        return response.json().get("id")
    return None


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Authentication endpoint tests for all roles"""
    
    def test_login_admin_success(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_login_sales_success(self, api_client):
        """Test sales login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": SALES_EMAIL,
            "password": SALES_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "sales"
        print(f"✓ Sales login successful: {data['user']['name']}")
    
    def test_login_support_success(self, api_client):
        """Test support login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPPORT_EMAIL,
            "password": SUPPORT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "support"
        print(f"✓ Support login successful: {data['user']['name']}")
    
    def test_login_support2_success(self, api_client):
        """Test second support user login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPPORT2_EMAIL,
            "password": SUPPORT2_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "support"
        print(f"✓ Support2 login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


# ============================================================================
# ACTIVITIES TESTS - CRUD, Search, Access Control
# ============================================================================

class TestActivities:
    """Activity endpoint tests including 7-field search and access control"""
    
    def test_create_activity_as_admin(self, api_client, admin_token, support_user_id):
        """Test creating an activity as admin"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Admin_Activity",
            "description": "Activity created by admin",
            "assigned_to": support_user_id,
            "status": "pending",
            "priority": "high",
            "invoice_number": "INV-TEST-001",
            "work_order_no": "WO-TEST-001",
            "serial_number": "SN-TEST-001"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Admin_Activity"
        assert data["invoice_number"] == "INV-TEST-001"
        print(f"✓ Activity created by admin: {data['id']}")
        return data["id"]
    
    def test_create_activity_as_support(self, api_client, support_token, support2_user_id):
        """Test creating an activity as support user"""
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Support_Activity",
            "description": "Activity created by support",
            "assigned_to": support2_user_id,
            "status": "pending",
            "priority": "medium",
            "invoice_number": "INV-SUPPORT-001",
            "work_order_no": "WO-SUPPORT-001"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Support_Activity"
        print(f"✓ Activity created by support: {data['id']}")
        return data["id"]
    
    def test_get_activities(self, api_client, admin_token):
        """Test getting all activities"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} activities")
    
    def test_search_activities_by_invoice(self, api_client, admin_token):
        """Test searching activities by invoice number"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities?search=INV-TEST")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search by invoice found {len(data)} activities")
    
    def test_search_activities_by_work_order(self, api_client, admin_token):
        """Test searching activities by work order number"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities?search=WO-TEST")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search by work order found {len(data)} activities")
    
    def test_search_activities_by_serial(self, api_client, admin_token):
        """Test searching activities by serial number"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities?search=SN-TEST")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search by serial number found {len(data)} activities")
    
    def test_filter_activities_by_status(self, api_client, admin_token):
        """Test filtering activities by status"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities?status=pending")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        for activity in data:
            assert activity["status"] == "pending"
        print(f"✓ Found {len(data)} pending activities")
    
    def test_activity_stats(self, api_client, admin_token):
        """Test getting activity statistics"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities/stats/summary")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "pending" in data
        assert "in_progress" in data
        assert "completed" in data
        print(f"✓ Activity stats: total={data['total']}, pending={data['pending']}")


class TestActivityAccessControl:
    """Test activity edit permissions: Admin OR Creator OR Assignee can edit"""
    
    def test_admin_can_edit_any_activity(self, api_client, admin_token, support_token, support_user_id, admin_user_id):
        """Admin should be able to edit any activity"""
        # First create activity as support (assigned_to is required)
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity_For_Admin_Edit",
            "description": "Created by support",
            "assigned_to": support_user_id,  # Required field
            "status": "pending"
        })
        api_client.headers.pop("Authorization", None)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        activity_id = create_response.json()["id"]
        
        # Admin edits the activity
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        update_response = api_client.put(f"{BASE_URL}/api/activities/{activity_id}", json={
            "title": "TEST_Activity_Edited_By_Admin",
            "status": "in_progress"
        })
        api_client.headers.pop("Authorization", None)
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "TEST_Activity_Edited_By_Admin"
        print("✓ Admin can edit any activity")
    
    def test_creator_can_edit_own_activity(self, api_client, support_token, support_user_id):
        """Creator should be able to edit their own activity"""
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        
        # Create activity (assigned_to is required)
        create_response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity_Creator_Edit",
            "description": "Created by support",
            "assigned_to": support_user_id,  # Required field
            "status": "pending"
        })
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        activity_id = create_response.json()["id"]
        
        # Creator edits their own activity
        update_response = api_client.put(f"{BASE_URL}/api/activities/{activity_id}", json={
            "title": "TEST_Activity_Edited_By_Creator",
            "status": "in_progress"
        })
        api_client.headers.pop("Authorization", None)
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "TEST_Activity_Edited_By_Creator"
        print("✓ Creator can edit their own activity")
    
    def test_assignee_can_edit_assigned_activity(self, api_client, admin_token, support2_token, support2_user_id):
        """Assignee should be able to edit activity assigned to them"""
        # Admin creates activity assigned to support2
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity_For_Assignee_Edit",
            "description": "Created by admin, assigned to support2",
            "assigned_to": support2_user_id,
            "status": "pending"
        })
        api_client.headers.pop("Authorization", None)
        assert create_response.status_code == 200
        activity_id = create_response.json()["id"]
        
        # Support2 (assignee) edits the activity
        api_client.headers.update({"Authorization": f"Bearer {support2_token}"})
        update_response = api_client.put(f"{BASE_URL}/api/activities/{activity_id}", json={
            "title": "TEST_Activity_Edited_By_Assignee",
            "status": "in_progress"
        })
        api_client.headers.pop("Authorization", None)
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "TEST_Activity_Edited_By_Assignee"
        print("✓ Assignee can edit assigned activity")
    
    def test_non_creator_non_assignee_cannot_edit(self, api_client, admin_token, support_token, support2_token, support_user_id):
        """Non-creator and non-assignee support user should NOT be able to edit"""
        # Admin creates activity assigned to support (NOT support2)
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity_No_Access",
            "description": "Created by admin, assigned to support (not support2)",
            "assigned_to": support_user_id,  # Assigned to support, not support2
            "status": "pending"
        })
        api_client.headers.pop("Authorization", None)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        activity_id = create_response.json()["id"]
        
        # Support2 tries to edit (should fail - not creator, not assignee)
        api_client.headers.update({"Authorization": f"Bearer {support2_token}"})
        update_response = api_client.put(f"{BASE_URL}/api/activities/{activity_id}", json={
            "title": "TEST_Should_Fail"
        })
        api_client.headers.pop("Authorization", None)
        assert update_response.status_code == 403
        print("✓ Non-creator/non-assignee correctly denied edit access")
    
    def test_admin_can_reassign_activity(self, api_client, admin_token, support_user_id, support2_user_id):
        """Admin should be able to reassign activities"""
        # Create activity assigned to support
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity_Reassign",
            "description": "Will be reassigned",
            "assigned_to": support_user_id,
            "status": "pending"
        })
        assert create_response.status_code == 200
        activity_id = create_response.json()["id"]
        
        # Admin reassigns to support2
        update_response = api_client.put(f"{BASE_URL}/api/activities/{activity_id}", json={
            "assigned_to": support2_user_id
        })
        api_client.headers.pop("Authorization", None)
        assert update_response.status_code == 200
        assert update_response.json()["assigned_to"] == support2_user_id
        print("✓ Admin can reassign activities")


# ============================================================================
# PRODUCTS TESTS - CRUD, CSV Export, Warranty
# ============================================================================

class TestProducts:
    """Product endpoint tests including CSV export and warranty tracking"""
    
    def test_create_product(self, api_client, admin_token):
        """Test creating a product with serial numbers"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_Product_001",
            "category": "others",  # Must match ProductCategory enum: industrial, retails, others
            "model": "Model-X",
            "description": "Test product description",
            "price": 999.99,
            "serial_numbers": [
                {
                    "serial_number": f"SN-TEST-{uuid.uuid4().hex[:8]}"
                }
            ]
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Product_001"
        assert "id" in data
        print(f"✓ Product created: {data['id']}")
    
    def test_get_products(self, api_client, admin_token):
        """Test getting all products"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/products")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} products")
    
    def test_export_products_csv(self, api_client, admin_token):
        """Test exporting products to CSV with warranty status"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/products/export/csv")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        # Check CSV has expected headers
        csv_content = response.text
        assert "Product Name" in csv_content
        assert "Warranty Status" in csv_content
        assert "Serial Number" in csv_content
        print("✓ Products CSV export working with warranty status")
    
    def test_get_warranty_expiring_products(self, api_client, admin_token):
        """Test getting products with expiring warranty"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/products/alerts/warranty-expiring?days=365")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} products with warranty expiring in 365 days")
    
    def test_get_maintenance_due_products(self, api_client, admin_token):
        """Test getting products with maintenance due"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/products/alerts/maintenance-due?days=365")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} products with maintenance due")
    
    def test_non_admin_cannot_create_product(self, api_client, support_token):
        """Test that non-admin cannot create products"""
        # Create a fresh session to avoid header pollution
        import requests as req
        fresh_client = req.Session()
        fresh_client.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {support_token}"
        })
        response = fresh_client.post(f"{BASE_URL}/api/products", json={
            "name": "TEST_Unauthorized_Product",
            "category": "others"  # Valid category
        })
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Non-admin correctly denied product creation")


# ============================================================================
# CUSTOMERS TESTS
# ============================================================================

class TestCustomers:
    """Customer endpoint tests"""
    
    def test_create_customer(self, api_client, admin_token):
        """Test creating a customer"""
        unique_email = f"TEST_customer_{uuid.uuid4().hex[:8]}@test.com"
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.post(f"{BASE_URL}/api/customers", json={
            "name": "TEST_Customer",
            "email": unique_email,
            "phone": "+1234567890",
            "company": "Test Company",
            "address": "123 Test St"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Customer"
        assert data["email"] == unique_email
        print(f"✓ Customer created: {data['id']}")
        return data["id"]
    
    def test_get_customers(self, api_client, admin_token):
        """Test getting all customers"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/customers")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} customers")
    
    def test_support_can_create_customer(self, api_client, support_token):
        """Test that support can create customers"""
        unique_email = f"TEST_support_customer_{uuid.uuid4().hex[:8]}@test.com"
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.post(f"{BASE_URL}/api/customers", json={
            "name": "TEST_Support_Customer",
            "email": unique_email,
            "phone": "+1234567890"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        print("✓ Support can create customers")


# ============================================================================
# LEADS TESTS
# ============================================================================

class TestLeads:
    """Lead endpoint tests"""
    
    def test_create_lead_as_sales(self, api_client, sales_token, admin_token):
        """Test creating a lead as sales user"""
        # First get a customer ID (required for lead creation)
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        customers_response = api_client.get(f"{BASE_URL}/api/customers")
        api_client.headers.pop("Authorization", None)
        
        customer_id = None
        if customers_response.status_code == 200 and customers_response.json():
            customer_id = customers_response.json()[0]["id"]
        else:
            # Create a customer first
            api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
            cust_response = api_client.post(f"{BASE_URL}/api/customers", json={
                "name": "TEST_Lead_Customer",
                "email": f"TEST_lead_cust_{uuid.uuid4().hex[:8]}@test.com"
            })
            api_client.headers.pop("Authorization", None)
            if cust_response.status_code == 200:
                customer_id = cust_response.json()["id"]
        
        if not customer_id:
            pytest.skip("Could not get or create customer for lead test")
        
        api_client.headers.update({"Authorization": f"Bearer {sales_token}"})
        response = api_client.post(f"{BASE_URL}/api/leads", json={
            "customer_id": customer_id,  # Required field
            "lead_title": "TEST_Lead_Title",
            "description": "Test lead description",
            "status": "new",
            "lead_source": "Website",
            "project_value": 50000
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["lead_title"] == "TEST_Lead_Title"
        print(f"✓ Lead created by sales: {data['id']}")
    
    def test_get_leads_as_sales(self, api_client, sales_token):
        """Test getting leads as sales user (should only see own leads)"""
        api_client.headers.update({"Authorization": f"Bearer {sales_token}"})
        response = api_client.get(f"{BASE_URL}/api/leads")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Sales user sees {len(data)} leads")
    
    def test_get_leads_as_admin(self, api_client, admin_token):
        """Test getting leads as admin (should see all leads)"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/leads")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin sees {len(data)} leads")
    
    def test_support_cannot_create_lead(self, api_client, support_token, admin_token):
        """Test that support cannot create leads"""
        # First get a customer ID
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        customers_response = api_client.get(f"{BASE_URL}/api/customers")
        api_client.headers.pop("Authorization", None)
        
        customer_id = "dummy-id"
        if customers_response.status_code == 200 and customers_response.json():
            customer_id = customers_response.json()[0]["id"]
        
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.post(f"{BASE_URL}/api/leads", json={
            "customer_id": customer_id,  # Required field
            "lead_title": "TEST_Unauthorized_Lead",
            "description": "Should fail"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        print("✓ Support correctly denied lead creation")


# ============================================================================
# LOCATION TRACKING TESTS - Admin-only access
# ============================================================================

class TestLocationTracking:
    """Location tracking tests - admin-only access"""
    
    def test_admin_can_access_current_locations(self, api_client, admin_token):
        """Test that admin can access current locations"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/locations/current")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin can access current locations: {len(data)} users with locations")
    
    def test_non_admin_cannot_access_current_locations(self, api_client, support_token):
        """Test that non-admin cannot access current locations"""
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.get(f"{BASE_URL}/api/locations/current")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 403
        print("✓ Non-admin correctly denied access to current locations")
    
    def test_user_can_access_own_location_history(self, api_client, support_token):
        """Test that user can access their own location history"""
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.get(f"{BASE_URL}/api/locations/my-history")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User can access own location history: {len(data)} records")
    
    def test_update_own_location(self, api_client, support_token):
        """Test that user can update their own location"""
        api_client.headers.update({"Authorization": f"Bearer {support_token}"})
        response = api_client.post(f"{BASE_URL}/api/locations", json={
            "latitude": 37.7749,
            "longitude": -122.4194,
            "accuracy": 10.0,
            "location_type": "auto"
        })
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert data["latitude"] == 37.7749
        print("✓ User can update own location")


# ============================================================================
# DASHBOARD TESTS
# ============================================================================

class TestDashboard:
    """Dashboard endpoint tests"""
    
    def test_get_dashboard_stats_as_admin(self, api_client, admin_token):
        """Test getting dashboard stats as admin"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_activities" in data
        assert "total_leads" in data
        print(f"✓ Dashboard stats: users={data['total_users']}, activities={data['total_activities']}, leads={data['total_leads']}")
    
    def test_get_dashboard_stats_as_sales(self, api_client, sales_token):
        """Test getting dashboard stats as sales (should see filtered leads)"""
        api_client.headers.update({"Authorization": f"Bearer {sales_token}"})
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        api_client.headers.pop("Authorization", None)
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        print(f"✓ Sales dashboard stats: leads={data['total_leads']}")


# ============================================================================
# CLEANUP
# ============================================================================

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_activities(self, api_client, admin_token):
        """Delete TEST_ prefixed activities"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/activities")
        if response.status_code == 200:
            activities = response.json()
            deleted = 0
            for activity in activities:
                if activity.get("title", "").startswith("TEST_"):
                    del_response = api_client.delete(f"{BASE_URL}/api/activities/{activity['id']}")
                    if del_response.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test activities")
        api_client.headers.pop("Authorization", None)
    
    def test_cleanup_test_products(self, api_client, admin_token):
        """Delete TEST_ prefixed products"""
        api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_client.get(f"{BASE_URL}/api/products")
        if response.status_code == 200:
            products = response.json()
            deleted = 0
            for product in products:
                if product.get("name", "").startswith("TEST_"):
                    del_response = api_client.delete(f"{BASE_URL}/api/products/{product['id']}")
                    if del_response.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test products")
        api_client.headers.pop("Authorization", None)
