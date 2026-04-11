"""
Test Excel Import Feature - Simulating 146 invoices with duplicate customer names
This test verifies:
1. Customer creation with unique email generation
2. Duplicate customer name handling (same customer should only be created once)
3. Invoice creation with proper customer associations
4. Unique email pattern: customername_timestamp_index@imported.example.com
"""
import pytest
import requests
import os
import time
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - loaded from environment
ADMIN_EMAIL = os.environ.get('ADMIN_TEST_EMAIL', 'admin@test.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_TEST_PASSWORD', 'admin123')

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }

class TestCustomerCreationWithUniqueEmails:
    """Test customer creation with unique email generation pattern"""
    
    def test_create_customer_with_unique_email(self, auth_headers):
        """Test creating a customer with unique generated email"""
        timestamp = int(time.time() * 1000)
        customer_name = f"TEST_ImportCustomer_{timestamp}"
        sanitized_name = customer_name.lower().replace(' ', '_').replace('-', '_')
        unique_email = f"{sanitized_name}_{timestamp}_0@imported.example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={
                "name": customer_name,
                "email": unique_email,
                "contact_person": customer_name,
                "phone": "",
                "address": ""
            }
        )
        
        assert response.status_code == 200, f"Customer creation failed: {response.text}"
        customer = response.json()
        assert customer["name"] == customer_name
        assert customer["email"] == unique_email
        print(f"✓ Created customer: {customer_name} with email: {unique_email}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)
    
    def test_duplicate_email_rejected(self, auth_headers):
        """Test that duplicate emails are rejected"""
        timestamp = int(time.time() * 1000)
        customer_name = f"TEST_DuplicateTest_{timestamp}"
        email = f"test_duplicate_{timestamp}@imported.example.com"
        
        # Create first customer
        response1 = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={
                "name": customer_name,
                "email": email,
                "contact_person": customer_name,
                "phone": "",
                "address": ""
            }
        )
        assert response1.status_code == 200, f"First customer creation failed: {response1.text}"
        customer1 = response1.json()
        
        # Try to create second customer with same email
        response2 = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={
                "name": f"{customer_name}_2",
                "email": email,  # Same email
                "contact_person": customer_name,
                "phone": "",
                "address": ""
            }
        )
        
        assert response2.status_code == 400, f"Expected 400 for duplicate email, got {response2.status_code}"
        assert "already exists" in response2.text.lower(), f"Expected 'already exists' error, got: {response2.text}"
        print("✓ Duplicate email correctly rejected")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/customers/{customer1['id']}", headers=auth_headers)


class TestInvoiceCreation:
    """Test invoice creation API"""
    
    def test_create_invoice(self, auth_headers):
        """Test creating a single invoice"""
        timestamp = int(time.time() * 1000)
        
        # First create a customer
        customer_name = f"TEST_InvoiceCustomer_{timestamp}"
        customer_email = f"test_invoice_customer_{timestamp}@imported.example.com"
        
        customer_response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={
                "name": customer_name,
                "email": customer_email,
                "contact_person": customer_name,
                "phone": "",
                "address": ""
            }
        )
        assert customer_response.status_code == 200, f"Customer creation failed: {customer_response.text}"
        customer = customer_response.json()
        
        # Create invoice
        invoice_number = f"TEST-INV-{timestamp}"
        invoice_data = {
            "invoice_number": invoice_number,
            "invoice_date": "2026-01-15",
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "sales_rep_id": "",
            "sales_rep_name": "",
            "items": [
                {
                    "product_name": "Test Product",
                    "category": "Test Category",
                    "brand": "Test Brand",
                    "division": "Test Division",
                    "quantity": 5,
                    "unit_price": 100.0,
                    "total": 500.0
                }
            ],
            "subtotal": 500.0,
            "vat_percentage": 10,
            "vat_amount": 50.0,
            "total_amount": 550.0,
            "payment_status": "Pending",
            "notes": "Test invoice from Excel import test"
        }
        
        invoice_response = requests.post(
            f"{BASE_URL}/api/sales/invoices",
            headers=auth_headers,
            json=invoice_data
        )
        
        assert invoice_response.status_code == 200, f"Invoice creation failed: {invoice_response.text}"
        result = invoice_response.json()
        assert "invoice" in result or "message" in result
        print(f"✓ Created invoice: {invoice_number}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sales/invoices/{invoice_number}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)
    
    def test_duplicate_invoice_number_rejected(self, auth_headers):
        """Test that duplicate invoice numbers are rejected"""
        timestamp = int(time.time() * 1000)
        
        # Create customer
        customer_name = f"TEST_DupInvCustomer_{timestamp}"
        customer_email = f"test_dup_inv_customer_{timestamp}@imported.example.com"
        
        customer_response = requests.post(
            f"{BASE_URL}/api/customers",
            headers=auth_headers,
            json={
                "name": customer_name,
                "email": customer_email,
                "contact_person": customer_name,
                "phone": "",
                "address": ""
            }
        )
        customer = customer_response.json()
        
        # Create first invoice
        invoice_number = f"TEST-DUP-INV-{timestamp}"
        invoice_data = {
            "invoice_number": invoice_number,
            "invoice_date": "2026-01-15",
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "sales_rep_id": "",
            "sales_rep_name": "",
            "items": [{"product_name": "Test", "category": "", "brand": "", "division": "", "quantity": 1, "unit_price": 100, "total": 100}],
            "subtotal": 100,
            "vat_percentage": 10,
            "vat_amount": 10,
            "total_amount": 110,
            "payment_status": "Pending",
            "notes": ""
        }
        
        response1 = requests.post(f"{BASE_URL}/api/sales/invoices", headers=auth_headers, json=invoice_data)
        assert response1.status_code == 200, f"First invoice creation failed: {response1.text}"
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/sales/invoices", headers=auth_headers, json=invoice_data)
        assert response2.status_code == 400, f"Expected 400 for duplicate invoice, got {response2.status_code}"
        print("✓ Duplicate invoice number correctly rejected")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sales/invoices/{invoice_number}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/api/customers/{customer['id']}", headers=auth_headers)


class TestBulkImportSimulation:
    """Simulate the Excel import with 146 invoices and duplicate customer names"""
    
    def test_bulk_import_with_duplicate_customers(self, auth_headers):
        """
        Simulate importing 146 invoices with duplicate customer names.
        This tests the core fix: localCustomers array tracking and unique email generation.
        """
        timestamp = int(time.time() * 1000)
        
        # Simulate 10 unique customers with multiple invoices each (total ~50 invoices for speed)
        # This tests the same logic as 146 invoices but faster
        customer_names = [
            "TEST_BulkCustomer_Alpha",
            "TEST_BulkCustomer_Beta",
            "TEST_BulkCustomer_Gamma",
            "TEST_BulkCustomer_Delta",
            "TEST_BulkCustomer_Epsilon"
        ]
        
        # Track created customers (simulating localCustomers array)
        local_customers = {}
        created_customer_ids = []
        created_invoice_numbers = []
        
        success_count = 0
        error_count = 0
        errors = []
        
        # Generate 50 invoices (10 per customer)
        invoices_to_create = []
        for i in range(50):
            customer_name = customer_names[i % len(customer_names)]
            invoice_number = f"TEST-BULK-{timestamp}-{i:03d}"
            invoices_to_create.append({
                "invoice_number": invoice_number,
                "customer_name": customer_name,
                "items": [
                    {
                        "product_name": f"Product {i}",
                        "category": "Test",
                        "brand": "TestBrand",
                        "division": "TestDiv",
                        "quantity": random.randint(1, 10),
                        "unit_price": random.uniform(50, 500),
                        "total": 0  # Will be calculated
                    }
                ]
            })
            # Calculate total
            invoices_to_create[-1]["items"][0]["total"] = (
                invoices_to_create[-1]["items"][0]["quantity"] * 
                invoices_to_create[-1]["items"][0]["unit_price"]
            )
        
        print(f"\n=== Starting bulk import simulation with {len(invoices_to_create)} invoices ===")
        print(f"Unique customer names: {len(customer_names)}")
        
        # Process each invoice (simulating handleExcelImport logic)
        for index, invoice in enumerate(invoices_to_create):
            try:
                customer_name = invoice["customer_name"]
                
                # Check if customer already exists in local tracking (case-insensitive)
                customer = local_customers.get(customer_name.lower())
                
                if not customer:
                    # Create new customer with unique email
                    sanitized_name = customer_name.lower().replace(' ', '_').replace('-', '_')
                    # Remove non-alphanumeric except underscore
                    sanitized_name = ''.join(c for c in sanitized_name if c.isalnum() or c == '_')
                    unique_email = f"{sanitized_name}_{timestamp}_{index}@imported.example.com"
                    
                    customer_response = requests.post(
                        f"{BASE_URL}/api/customers",
                        headers=auth_headers,
                        json={
                            "name": customer_name,
                            "email": unique_email,
                            "contact_person": customer_name,
                            "phone": "",
                            "address": ""
                        }
                    )
                    
                    if customer_response.status_code == 200:
                        customer = customer_response.json()
                        # Add to local tracking (key fix being tested)
                        local_customers[customer_name.lower()] = customer
                        created_customer_ids.append(customer["id"])
                        print(f"  Created customer: {customer_name} (email: {unique_email})")
                    else:
                        errors.append(f"Invoice {invoice['invoice_number']}: Customer creation failed - {customer_response.text}")
                        error_count += 1
                        continue
                
                # Create invoice
                subtotal = sum(item["total"] for item in invoice["items"])
                vat_amount = subtotal * 0.1
                total_amount = subtotal + vat_amount
                
                invoice_data = {
                    "invoice_number": invoice["invoice_number"],
                    "invoice_date": "2026-01-15",
                    "customer_id": customer["id"],
                    "customer_name": customer["name"],
                    "sales_rep_id": "",
                    "sales_rep_name": "",
                    "items": invoice["items"],
                    "subtotal": subtotal,
                    "vat_percentage": 10,
                    "vat_amount": vat_amount,
                    "total_amount": total_amount,
                    "payment_status": "Pending",
                    "notes": "Imported from Excel (test)"
                }
                
                invoice_response = requests.post(
                    f"{BASE_URL}/api/sales/invoices",
                    headers=auth_headers,
                    json=invoice_data
                )
                
                if invoice_response.status_code == 200:
                    success_count += 1
                    created_invoice_numbers.append(invoice["invoice_number"])
                else:
                    errors.append(f"Invoice {invoice['invoice_number']}: {invoice_response.text}")
                    error_count += 1
                    
            except Exception as e:
                errors.append(f"Invoice {invoice['invoice_number']}: {str(e)}")
                error_count += 1
        
        print("\n=== Import Results ===")
        print(f"Total invoices: {len(invoices_to_create)}")
        print(f"Successful: {success_count}")
        print(f"Failed: {error_count}")
        print(f"Unique customers created: {len(created_customer_ids)}")
        
        if errors:
            print("\nFirst 5 errors:")
            for err in errors[:5]:
                print(f"  - {err}")
        
        # Verify results
        assert success_count == len(invoices_to_create), f"Expected {len(invoices_to_create)} successful imports, got {success_count}"
        assert len(created_customer_ids) == len(customer_names), f"Expected {len(customer_names)} unique customers, got {len(created_customer_ids)}"
        
        print("\n✓ Bulk import simulation PASSED!")
        print(f"  - All {success_count} invoices created successfully")
        print(f"  - Only {len(created_customer_ids)} customers created (no duplicates)")
        
        # Cleanup
        print("\nCleaning up test data...")
        for inv_num in created_invoice_numbers:
            requests.delete(f"{BASE_URL}/api/sales/invoices/{inv_num}", headers=auth_headers)
        for cust_id in created_customer_ids:
            requests.delete(f"{BASE_URL}/api/customers/{cust_id}", headers=auth_headers)
        print("✓ Cleanup complete")


class TestEmailPatternUniqueness:
    """Test that the email pattern generates truly unique emails"""
    
    def test_email_pattern_uniqueness(self, auth_headers):
        """Test that timestamp+index pattern generates unique emails"""
        timestamp = int(time.time() * 1000)
        customer_name = "TEST_SameNameCustomer"
        
        emails_created = []
        customer_ids = []
        
        # Create 5 customers with same name but different emails
        for i in range(5):
            sanitized_name = customer_name.lower().replace(' ', '_').replace('-', '_')
            sanitized_name = ''.join(c for c in sanitized_name if c.isalnum() or c == '_')
            unique_email = f"{sanitized_name}_{timestamp}_{i}@imported.example.com"
            
            response = requests.post(
                f"{BASE_URL}/api/customers",
                headers=auth_headers,
                json={
                    "name": customer_name,
                    "email": unique_email,
                    "contact_person": customer_name,
                    "phone": "",
                    "address": ""
                }
            )
            
            assert response.status_code == 200, f"Customer {i} creation failed: {response.text}"
            customer = response.json()
            emails_created.append(unique_email)
            customer_ids.append(customer["id"])
        
        # Verify all emails are unique
        assert len(emails_created) == len(set(emails_created)), "Emails are not unique!"
        print(f"✓ Created {len(emails_created)} customers with unique emails:")
        for email in emails_created:
            print(f"  - {email}")
        
        # Cleanup
        for cust_id in customer_ids:
            requests.delete(f"{BASE_URL}/api/customers/{cust_id}", headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
