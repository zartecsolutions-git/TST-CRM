"""
CRM API Backend Tests
Tests for authentication, users, locations, activities, teams, geofences, and dashboard endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dept-action-crm-1.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"
AGENT_EMAIL = "agent@test.com"
AGENT_PASSWORD = "agent123"
CLIENT_EMAIL = "client@test.com"
CLIENT_PASSWORD = "client123"


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
    pytest.skip("Admin authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def agent_token(api_client):
    """Get agent authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": AGENT_EMAIL,
        "password": AGENT_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Agent authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['name']}")
    
    def test_login_agent_success(self, api_client):
        """Test agent login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": AGENT_EMAIL,
            "password": AGENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "agent"
        print(f"Agent login successful: {data['user']['name']}")
    
    def test_login_client_success(self, api_client):
        """Test client login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "client"
        print(f"Client login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Invalid login correctly rejected: {data['detail']}")
    
    def test_register_new_user(self, api_client):
        """Test user registration"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "phone": "+1234567890",
            "role": "agent"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["role"] == "agent"
        print(f"Registration successful: {unique_email}")
    
    def test_register_duplicate_email(self, api_client):
        """Test registration with existing email"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "testpass123",
            "name": "Duplicate User",
            "role": "agent"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"Duplicate email correctly rejected: {data['detail']}")
    
    def test_get_current_user(self, authenticated_client):
        """Test getting current user info"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "role" in data
        print(f"Current user: {data['email']} ({data['role']})")


# ============================================================================
# USER TESTS
# ============================================================================

class TestUsers:
    """User endpoint tests"""
    
    def test_get_all_users(self, authenticated_client):
        """Test getting all users"""
        response = authenticated_client.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least admin, agent, client
        print(f"Found {len(data)} users")
    
    def test_get_users_by_role(self, authenticated_client):
        """Test filtering users by role"""
        response = authenticated_client.get(f"{BASE_URL}/api/users?role=agent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for user in data:
            assert user["role"] == "agent"
        print(f"Found {len(data)} agents")
    
    def test_get_user_by_id(self, authenticated_client):
        """Test getting a specific user"""
        # First get all users to find an ID
        users_response = authenticated_client.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        if users:
            user_id = users[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/users/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == user_id
            print(f"Retrieved user: {data['name']}")
    
    def test_get_nonexistent_user(self, authenticated_client):
        """Test getting a user that doesn't exist"""
        response = authenticated_client.get(f"{BASE_URL}/api/users/nonexistent-id")
        assert response.status_code == 404


# ============================================================================
# DASHBOARD TESTS
# ============================================================================

class TestDashboard:
    """Dashboard endpoint tests"""
    
    def test_get_dashboard_stats(self, authenticated_client):
        """Test getting dashboard statistics"""
        response = authenticated_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields are present
        expected_fields = [
            "total_users", "total_agents", "total_clients", "active_users",
            "total_activities", "pending_activities", "completed_activities",
            "total_teams", "total_geofences"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify values are non-negative integers
        for field in expected_fields:
            assert isinstance(data[field], int), f"{field} should be an integer"
            assert data[field] >= 0, f"{field} should be non-negative"
        
        print(f"Dashboard stats: {data}")


# ============================================================================
# LOCATION TESTS
# ============================================================================

class TestLocations:
    """Location endpoint tests"""
    
    def test_update_location(self, authenticated_client):
        """Test updating user location"""
        response = authenticated_client.post(f"{BASE_URL}/api/locations", json={
            "latitude": 37.7749,
            "longitude": -122.4194,
            "accuracy": 10.0,
            "location_type": "auto"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["latitude"] == 37.7749
        assert data["longitude"] == -122.4194
        assert "id" in data
        assert "user_id" in data
        print(f"Location updated: {data['latitude']}, {data['longitude']}")
    
    def test_get_current_locations(self, authenticated_client):
        """Test getting current locations for all users"""
        response = authenticated_client.get(f"{BASE_URL}/api/locations/current")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} users with locations")
    
    def test_get_user_location_history(self, authenticated_client):
        """Test getting location history for a user"""
        # First get users
        users_response = authenticated_client.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        if users:
            user_id = users[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/locations/user/{user_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"Found {len(data)} location records for user")
    
    def test_get_user_distance(self, authenticated_client):
        """Test getting distance traveled by user"""
        users_response = authenticated_client.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        if users:
            user_id = users[0]["id"]
            response = authenticated_client.get(f"{BASE_URL}/api/locations/user/{user_id}/distance")
            assert response.status_code == 200
            data = response.json()
            assert "total_distance_meters" in data
            assert "total_distance_km" in data
            print(f"Distance: {data['total_distance_km']} km")


# ============================================================================
# ACTIVITY TESTS
# ============================================================================

class TestActivities:
    """Activity endpoint tests"""
    
    def test_create_activity(self, authenticated_client):
        """Test creating an activity"""
        # Get a user to assign to
        users_response = authenticated_client.get(f"{BASE_URL}/api/users")
        users = users_response.json()
        agent_user = next((u for u in users if u["role"] == "agent"), users[0])
        
        response = authenticated_client.post(f"{BASE_URL}/api/activities", json={
            "title": "TEST_Activity",
            "description": "Test activity description",
            "assigned_to": agent_user["id"],
            "status": "pending",
            "priority": "medium"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "TEST_Activity"
        assert data["status"] == "pending"
        assert "id" in data
        print(f"Activity created: {data['id']}")
        return data["id"]
    
    def test_get_activities(self, authenticated_client):
        """Test getting all activities"""
        response = authenticated_client.get(f"{BASE_URL}/api/activities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} activities")
    
    def test_get_activities_by_status(self, authenticated_client):
        """Test filtering activities by status"""
        response = authenticated_client.get(f"{BASE_URL}/api/activities?status=pending")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for activity in data:
            assert activity["status"] == "pending"
        print(f"Found {len(data)} pending activities")
    
    def test_get_activities_stats(self, authenticated_client):
        """Test getting activity statistics"""
        response = authenticated_client.get(f"{BASE_URL}/api/activities/stats/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "pending" in data
        assert "in_progress" in data
        assert "completed" in data
        print(f"Activity stats: {data}")


# ============================================================================
# TEAM TESTS
# ============================================================================

class TestTeams:
    """Team endpoint tests"""
    
    def test_create_team(self, authenticated_client):
        """Test creating a team"""
        response = authenticated_client.post(f"{BASE_URL}/api/teams", json={
            "name": f"TEST_Team_{uuid.uuid4().hex[:6]}",
            "description": "Test team description"
        })
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "id" in data
        print(f"Team created: {data['name']}")
        return data["id"]
    
    def test_get_teams(self, authenticated_client):
        """Test getting all teams"""
        response = authenticated_client.get(f"{BASE_URL}/api/teams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} teams")


# ============================================================================
# GEOFENCE TESTS
# ============================================================================

class TestGeofences:
    """Geofence endpoint tests"""
    
    def test_create_geofence(self, authenticated_client):
        """Test creating a geofence"""
        response = authenticated_client.post(f"{BASE_URL}/api/geofences", json={
            "name": f"TEST_Geofence_{uuid.uuid4().hex[:6]}",
            "description": "Test geofence",
            "center_lat": 37.7749,
            "center_lng": -122.4194,
            "radius": 500,
            "color": "#3B82F6",
            "alert_on_enter": True,
            "alert_on_exit": True
        })
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "id" in data
        assert data["radius"] == 500
        print(f"Geofence created: {data['name']}")
        return data["id"]
    
    def test_get_geofences(self, authenticated_client):
        """Test getting all geofences"""
        response = authenticated_client.get(f"{BASE_URL}/api/geofences")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} geofences")
    
    def test_get_geofence_alerts(self, authenticated_client):
        """Test getting geofence alerts"""
        response = authenticated_client.get(f"{BASE_URL}/api/geofences/alerts/list")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} geofence alerts")


# ============================================================================
# UNAUTHORIZED ACCESS TESTS
# ============================================================================

class TestUnauthorizedAccess:
    """Test that endpoints require authentication"""
    
    def test_dashboard_requires_auth(self, api_client):
        """Test that dashboard stats requires authentication"""
        # Remove auth header if present
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code in [401, 403]
        print("Dashboard correctly requires authentication")
    
    def test_users_requires_auth(self, api_client):
        """Test that users endpoint requires authentication"""
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/users")
        assert response.status_code in [401, 403]
        print("Users endpoint correctly requires authentication")
    
    def test_locations_requires_auth(self, api_client):
        """Test that locations endpoint requires authentication"""
        api_client.headers.pop("Authorization", None)
        response = api_client.get(f"{BASE_URL}/api/locations/current")
        assert response.status_code in [401, 403]
        print("Locations endpoint correctly requires authentication")
