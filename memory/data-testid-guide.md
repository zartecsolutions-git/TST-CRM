# Data-TestID Implementation Guide

## Overview
This document tracks all `data-testid` attributes added to the CRM application for E2E testing stability.

## Naming Convention
- **Buttons**: `{action}-{context}-btn` (e.g., `login-btn`, `create-customer-btn`)
- **Inputs**: `{field}-input` (e.g., `email-input`, `customer-name-input`)
- **Forms**: `{entity}-form` (e.g., `login-form`, `create-customer-form`)
- **Modals**: `{entity}-modal` (e.g., `edit-customer-modal`)
- **Tables**: `{entity}-table` (e.g., `customers-table`)
- **Table Rows**: `{entity}-row-{index}` (e.g., `customer-row-0`)
- **Navigation**: `nav-{page}` (e.g., `nav-dashboard`, `nav-customers`)

---

## Implemented Test IDs

### ✅ Login Page (`/app/frontend/src/pages/Login.js`)
- `login-form` - Main login form
- `login-error` - Error message display
- `email-input` - Email input field
- `password-input` - Password input field
- `login-submit-button` - Submit button

### ✅ Navigation/Layout (`/app/frontend/src/components/layout/MobileLayout.jsx`)

**Mobile Header:**
- `user-name-header` - User name display
- `profile-menu-btn` - Profile dropdown toggle
- `profile-dropdown` - Profile dropdown menu
- `mobile-nav-{page}` - Mobile navigation links (e.g., `mobile-nav-users`, `mobile-nav-settings`)
- `logout-btn` - Mobile logout button

**Desktop Sidebar:**
- `nav-dashboard` - Dashboard navigation link
- `nav-activities` - Activities navigation link
- `nav-customers` - Customers navigation link
- `nav-products` - Products navigation link
- `nav-leads` - Leads navigation link
- `nav-sales-invoices` - Sales Invoices navigation link
- `nav-sales-reports` - Sales Reports navigation link
- `nav-users` - Users navigation link (Admin only)
- `nav-teams` - Teams navigation link (Admin only)
- `nav-location-tracking` - Location tracking navigation link (Admin only)
- `nav-master-data` - Master Data navigation link (Admin only)
- `nav-reports` - Reports navigation link (Admin only)
- `nav-settings` - Settings navigation link (Admin only)
- `desktop-logout-btn` - Desktop logout button

### ✅ Customers Page (`/app/frontend/src/pages/Customers.js`)

**Page Actions:**
- `back-to-dashboard-btn` - Back to dashboard button (desktop)
- `add-customer-btn` - Add customer button (desktop)
- `mobile-add-customer-btn` - Add customer button (mobile)
- `customer-search-input` - Search input field

**Create Customer Modal:**
- `create-customer-modal` - Modal container
- `create-customer-form` - Create form
- `customer-name-input` - Name input
- `customer-email-input` - Email input
- `customer-phone-input` - Phone input
- `customer-contact-input` - Contact person input
- `customer-region-input` - Region input
- `customer-business-input` - Business vertical input
- `customer-address-input` - Address textarea
- `cancel-create-btn` - Cancel button
- `submit-create-customer-btn` - Submit button

**Edit Customer Modal:**
- `edit-customer-modal` - Modal container
- `edit-customer-form` - Edit form
- `cancel-edit-btn` - Cancel button
- `save-customer-btn` - Save changes button

**Table:**
- `customers-table` - Main customers table
- `customer-row-{index}` - Individual customer rows (e.g., `customer-row-0`, `customer-row-1`)
- `edit-customer-btn-{index}` - Edit buttons for each customer
- `no-customers-message` - Empty state message

---

## Pending Test IDs (To Be Added)

### Priority 1 (Critical User Flows)
- [ ] **Activities Page** - Create, edit, search, filter activities
- [ ] **Sales Invoices Page** - Excel import, create invoice, search, filters
- [ ] **Products Page** - Create, edit, serial numbers, CSV export
- [ ] **Leads Page** - Create, edit, status management
- [ ] **Users Page** - Create, edit users, role management

### Priority 2 (Admin Features)
- [ ] **Master Data Page** - Categories, brands, divisions, models
- [ ] **Sales Reports Page** - Date filters, charts, export
- [ ] **Company Settings Page** - Logo upload, company info

### Priority 3 (Additional Features)
- [ ] **Dashboard** - Stats cards, charts
- [ ] **Location Tracking** - Map, user locations
- [ ] **Teams & Geofences** - Team management, geofence creation

---

## Testing Examples

### Example Playwright Test
```javascript
// Login flow
await page.fill('[data-testid="email-input"]', 'admin@test.com');
await page.fill('[data-testid="password-input"]', 'admin123');
await page.click('[data-testid="login-submit-button"]');

// Navigate to customers
await page.click('[data-testid="nav-customers"]');

// Create customer
await page.click('[data-testid="add-customer-btn"]');
await page.fill('[data-testid="customer-name-input"]', 'Test Company');
await page.fill('[data-testid="customer-email-input"]', 'test@example.com');
await page.click('[data-testid="submit-create-customer-btn"]');

// Search customer
await page.fill('[data-testid="customer-search-input"]', 'Test Company');

// Edit customer
await page.click('[data-testid="edit-customer-btn-0"]');
await page.fill('[data-testid="customer-name-input"]', 'Updated Company');
await page.click('[data-testid="save-customer-btn"]');
```

---

## Best Practices

1. **Consistency**: Always use the naming convention defined above
2. **Uniqueness**: Ensure test IDs are unique within a page
3. **Descriptive**: Make test IDs self-explanatory
4. **Index-based for lists**: Use `{entity}-row-{index}` for dynamic lists
5. **Avoid implementation details**: Don't include CSS classes or component names
6. **Keep it simple**: Shorter is better, but must be clear

---

## Implementation Checklist

When adding test IDs to a new page:
1. [ ] Add test ID to page container/wrapper
2. [ ] Add test IDs to all buttons (create, edit, delete, save, cancel)
3. [ ] Add test IDs to all input fields
4. [ ] Add test IDs to forms
5. [ ] Add test IDs to modals/dialogs
6. [ ] Add test IDs to tables and table rows
7. [ ] Add test IDs to navigation/links
8. [ ] Add test IDs to error/success messages
9. [ ] Test locally with browser DevTools
10. [ ] Update this document

---

## Version History
- **v1.0** (2026-04-11): Initial implementation
  - Login page (already had test IDs)
  - Navigation/MobileLayout (added mobile & desktop)
  - Customers page (comprehensive coverage)
