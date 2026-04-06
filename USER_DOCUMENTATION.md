# CRM Application - User Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Web Dashboard](#web-dashboard)
5. [Mobile Application](#mobile-application)
6. [Feature Guides](#feature-guides)
7. [FAQs](#faqs)

---

## 1. Introduction

Welcome to the CRM (Customer Relationship Management) application! This comprehensive system helps manage your business activities, track customer interactions, manage products, and monitor field staff locations.

### System Components
- **Web Dashboard**: Admin and management interface
- **Mobile App**: Field staff application for Android devices
- **Backend API**: Secure data management system

---

## 2. Getting Started

### Web Dashboard Access
1. Open your web browser
2. Navigate to your CRM URL
3. Enter your credentials:
   - Email address
   - Password
4. Click "Sign In"

### Mobile App Setup
1. Download the CRM Mobile APK file
2. Install on your Android device
3. Grant required permissions:
   - Location access (for activity tracking)
   - Storage access (for files)
4. Log in with your credentials

---

## 3. User Roles

The CRM system supports three user roles, each with specific permissions:

### 👨‍💼 Admin
**Full System Access**
- Manage all users, customers, products, and activities
- View location tracking for all field staff
- Generate reports and export data
- Assign and reassign activities
- Access all features without restrictions

### 💼 Sales
**Sales-Focused Access**
- Manage own leads and customer interactions
- Create and view activities
- View products and customers
- Export product data
- Cannot access location tracking
- Cannot manage other users' leads

### 🔧 Support
**Field Service Access**
- Create and manage assigned activities
- View all activities (read-only for others)
- Create customers
- View products
- Location automatically tracked (background)
- Cannot access location tracking dashboard
- Cannot manage leads

---

## 4. Web Dashboard

### 4.1 Dashboard Home

#### Admin Dashboard
Displays comprehensive system statistics:
- **Total Activities**: All activities across the system
- **Completed Activities**: Successfully completed tasks
- **Total Value**: Revenue from completed activities
- **Pending Tasks**: Activities awaiting action
- **Location Tracking**: Quick access to staff locations

#### Sales Dashboard
Shows sales-specific metrics:
- **My Leads**: Your active leads
- **Lead Conversion Rate**: Success metrics
- **Recent Activities**: Your recent work
- **Product Catalog**: Available products

#### Support Dashboard
Displays field service data:
- **Assigned Activities**: Tasks assigned to you
- **In Progress**: Currently active tasks
- **Completed Today**: Today's completed work
- **Customer List**: Access to customer database

---

### 4.2 Activities Management

#### Creating an Activity
1. Click **"+ Create Activity"** button
2. Fill in required fields:
   - **Title**: Brief description
   - **Type**: Demo/POC, Installation, Maintenance, Support, Training, or New Installation
   - **Customer**: Select from dropdown
   - **Product Serial Number**: Select assigned serial number
   - **Assigned To**: Choose support user
   - **Priority**: High, Medium, or Low
   - **Description**: Detailed information
3. Optional fields:
   - Due date
   - Work order number
   - Invoice number
4. Click **"Create Activity"**

#### Searching Activities
Use the search bar to find activities by:
- Product serial number
- Customer name
- Invoice number
- Work order number
- Assigned user name
- Created by user name
- Activity title

**Example**: Type "454" to find all activities with work order #454

#### Filtering Activities
Click filter buttons to view:
- **All**: Every activity
- **Pending**: Not yet started
- **In Progress**: Currently active
- **Completed**: Finished tasks

#### Viewing Activity Details
1. Click **"👁️ View Details"** on any activity
2. See complete information:
   - Activity details and status
   - Customer information
   - Product serial number
   - Financial details (amount, invoice #)
   - Progress updates history
   - Status change history
3. Available actions (based on role):
   - **Start Activity** (if pending)
   - **Add Progress** (if in progress)
   - **Mark Complete** (when finished)
   - **Edit Assignment** (Admin only)

#### Adding Progress Updates
*For creator, assignee, or admin only*
1. Open activity detail
2. Click **"Add Progress"**
3. Enter progress update text
4. Optionally add:
   - Next maintenance date (for completion)
5. Click **"Add Progress"**

#### Completing Activities
1. Open in-progress activity
2. Click **"Add Progress"** for final update
3. Click **"Mark Complete"**
4. Add completion details:
   - Work order number (if not added)
   - Invoice number
   - Amount
   - Next maintenance date
5. Submit

#### Admin: Reassigning Activities
1. Open any activity detail
2. Click **"✏️ Edit Assignment"** (bottom right)
3. Select new assignee from dropdown
4. Click **"Update Assignment"**
5. Activity immediately reassigned

---

### 4.3 Products Management

#### Viewing Products
1. Click **"Products"** in navigation
2. View product list with:
   - Product name and details
   - Category and model
   - Serial numbers assigned
   - Customer assignments
   - Warranty status

#### Adding a Product
1. Click **"+ Add Product"**
2. Fill in basic details:
   - Product name
   - Category
   - Model number
   - Price
3. Click **"Create Product"**

#### Assigning Serial Numbers to Customers
1. Find product in list
2. Click **"+ Add Serial Numbers"**
3. Enter serial numbers (one per line or comma-separated)
4. Click **"Next"**
5. Assign to customer:
   - Select customer
   - Enter sales date
   - Enter warranty period (months)
   - Enter purchase date (from supplier)
   - Enter supplier warranty period
   - Enter license code (if applicable)
6. Click **"Assign"**
7. Warranty end dates calculated automatically

#### Exporting Product Data
1. Click **"📥 Export CSV"** button
2. CSV file downloads with:
   - Product name, category, model
   - Serial number
   - Customer assignment
   - Warranty period (months)
   - Warranty end date
   - **Warranty status** (Active/Expired)
   - Next maintenance date
   - License code
   - Sales and purchase dates
3. Open in Excel or Google Sheets

**CSV Use Cases:**
- Warranty tracking
- Maintenance scheduling
- Inventory reports
- Customer reports

---

### 4.4 Customers Management

#### Adding a Customer
1. Click **"Customers"** in navigation
2. Click **"+ Add Customer"**
3. Enter details:
   - Name (required)
   - Email (required)
   - Phone
   - Company
   - Address
4. Click **"Add Customer"**

#### Viewing Customer List
- See all customers with:
  - Contact information
  - Company details
  - Creation date
- Search by name or email
- Click **"View"** for full details

---

### 4.5 Leads Management
*(Sales and Admin only)*

#### Creating a Lead
1. Navigate to **"Leads"**
2. Click **"+ Create Lead"**
3. Fill in details:
   - Company name
   - Contact person
   - Email and phone
   - Status (New, Contacted, Qualified, etc.)
   - Value estimate
   - Notes
4. Click **"Create Lead"**

#### Lead Pipeline
View leads in different stages:
- **New**: Just created
- **Contacted**: Initial contact made
- **Qualified**: Potential customer
- **Proposal**: Quote sent
- **Negotiation**: Discussing terms
- **Won**: Converted to customer
- **Lost**: Not converted

#### Managing Leads
- **Sales users**: See only own leads
- **Admin users**: See all leads
- Update status as lead progresses
- Add notes for follow-up
- Convert won leads to customers

---

### 4.6 Location Tracking
*(Admin only)*

#### Accessing Location Tracking
1. Click **"📍 Location Tracking"** button (top right)
2. View real-time map of all field staff

#### Features
- **Current Locations**: See where each user is now
- **Active Users**: Count of users active in last 30 minutes
- **Location History**: Filter by user and time range
  - Today
  - This week
  - This month
- **View on Map**: Click to see location in Google Maps

#### Privacy Note
- Users' locations are tracked automatically
- Users cannot see their own location history
- Only admins have access to location data
- Used for workforce management and safety

---

## 5. Mobile Application

### 5.1 Mobile App Features

The CRM Mobile app is designed for field staff (Support role) with the following features:

#### Dashboard
- View assigned activities
- See pending and in-progress tasks
- Quick stats display

#### Activities
- View all assigned activities
- Filter by status
- See activity details
- Update activity status
- Add progress updates

#### Products
- View product catalog
- See serial number details
- Check warranty status

#### Customers
- Access customer database
- View customer details
- Contact information

### 5.2 Using the Mobile App

#### Logging In
1. Open CRM Mobile app
2. Enter email and password
3. Tap **"Sign In"**
4. Grant location permission when prompted

#### Viewing Activities
1. Tap **"Activities"** tab
2. Scroll through list
3. Tap any activity to view details
4. Use filters to narrow down list

#### Starting an Activity
1. Find pending activity
2. Tap **"Start"** button
3. Activity status changes to "In Progress"

#### Adding Progress
1. Open in-progress activity
2. Tap **"Add Progress"**
3. Enter update text
4. Tap **"Submit"**

#### Completing an Activity
1. Open in-progress activity
2. Tap **"Complete"** button
3. Add completion details:
   - Work order number
   - Invoice number
   - Amount
4. Tap **"Submit"**

### 5.3 Location Tracking (Background)

**Important**: The mobile app automatically tracks your location in the background.

- Tracking starts automatically when you log in
- Runs continuously while logged in
- Used for:
  - Safety and security
  - Activity verification
  - Route optimization
  - Management oversight
- Battery optimized (minimal impact)
- Cannot be disabled within app

**What to know:**
- Your location is visible to admins only
- Updates every 1 minute or 50 meters
- Works even when app is closed
- Required for field staff role

---

## 6. Feature Guides

### 6.1 Activity Workflow

**Complete Activity Lifecycle:**

1. **Creation** (Admin/Sales/Support)
   - Create new activity
   - Assign to support user
   - Set priority and due date

2. **Assignment** (Automatic)
   - Support user sees activity in their list
   - Receives notification (if enabled)

3. **Start** (Support/Assignee)
   - User starts activity
   - Status changes to "In Progress"
   - Location tracking logs start location

4. **Progress** (Support/Assignee)
   - Add updates as work progresses
   - Multiple progress entries allowed
   - Visible to all users

5. **Completion** (Support/Assignee)
   - Mark as complete
   - Add financial details
   - Set next maintenance date
   - Status changes to "Completed"

6. **Review** (Admin/Manager)
   - Review completed work
   - Export reports
   - Plan follow-ups

### 6.2 Product Warranty Management

**Tracking Warranty Status:**

1. **Product Creation**
   - Add product to system
   - Define category and model

2. **Serial Number Assignment**
   - Assign multiple serial numbers
   - Link each to a customer
   - Enter warranty period (months)
   - System calculates expiry date

3. **Warranty Monitoring**
   - CSV export shows warranty status:
     - **Active**: Still under warranty
     - **Expired**: Warranty ended
     - **N/A**: No warranty assigned
   - Set up alerts for expiring warranties
   - Plan renewals

4. **Maintenance Scheduling**
   - Set next maintenance date
   - Link to activities
   - Track maintenance history

### 6.3 Search Best Practices

**Effective Searching:**

**Activities Search:**
- Use specific terms: "Invoice: INV-2024-001"
- Search by customer name: "Acme Corp"
- Find by serial: "SN12345"
- Search user: "John Doe"

**Products Search:**
- Filter by category
- Search by serial number
- Find customer assignments

**Customers Search:**
- Search by name or email
- Filter by company

---

## 7. FAQs

### General

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions)

**Q: Can I use the mobile app on iOS?**
A: Currently, only Android is supported. iOS coming soon.

**Q: How do I reset my password?**
A: Contact your administrator for password reset.

### Activities

**Q: Can I edit someone else's activity?**
A: Only if you're assigned to it or you're an admin.

**Q: How do I search for a specific work order?**
A: Use the search bar and type the work order number.

**Q: Can I delete an activity?**
A: Only admins can delete activities.

### Products

**Q: How is warranty status calculated?**
A: System compares warranty end date with current date. If end date has passed, status is "Expired".

**Q: Can I bulk assign serial numbers?**
A: Yes, enter multiple serial numbers separated by commas or new lines.

**Q: Where do I find the CSV export?**
A: Products page → Click "📥 Export CSV" button.

### Location Tracking

**Q: Can I see my own location history?**
A: No, only admins can view location data.

**Q: How often is my location tracked?**
A: Every 1 minute or when you move 50 meters.

**Q: Can I turn off location tracking?**
A: No, it's required for field staff. It runs automatically in the background.

**Q: Does it drain my battery?**
A: The app is optimized for minimal battery impact.

### Permissions

**Q: What can Sales users see?**
A: Sales can manage leads, view activities, customers, and products. Cannot access location tracking.

**Q: What can Support users do?**
A: Support can create activities, manage assigned tasks, and view customers. Cannot manage leads or view location tracking.

**Q: Can Support users create customers?**
A: Yes, Support can create customers.

---

## Support & Contact

For technical support or questions not covered in this guide, contact:
- **Email**: support@yourcrm.com
- **Phone**: [Your support number]
- **Admin**: Contact your system administrator

---

## Quick Reference

### Web Dashboard URLs
- Dashboard: `/dashboard`
- Activities: `/activities`
- Products: `/products`
- Customers: `/customers`
- Leads: `/leads`
- Location Tracking: `/location-tracking` (Admin only)

### Mobile App Tabs
- Dashboard
- Activities
- Products
- Customers
- Profile

### Search Syntax
- Exact match: Use quotes "INV-001"
- Partial match: Type any part
- Multiple terms: Space-separated

### Keyboard Shortcuts (Web)
- `Ctrl/Cmd + K`: Focus search
- `Esc`: Close modals

---

**Version**: 1.0.0
**Last Updated**: December 2025

---

*This documentation is subject to updates as new features are added to the CRM system.*
