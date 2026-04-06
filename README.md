# 🚀 CRM Application - Full-Stack Customer Relationship Management System

![CRM](https://img.shields.io/badge/CRM-Production%20Ready-success)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native-61DAFB)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248)

A comprehensive, production-ready CRM solution with web dashboard and mobile application for managing customers, products, activities, leads, and real-time location tracking.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Security](#-security)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Functionality
- **Role-Based Access Control**: Admin, Sales, Support roles with granular permissions
- **Customer Management**: Complete customer master data with advanced search
- **Product Management**: Serial number tracking, warranty management, maintenance scheduling
- **Activity Tracking**: Work orders, invoice linking, product/customer associations
- **Leads Management**: Sales pipeline for lead tracking and conversion
- **Real-Time Location Tracking**: Silent background GPS tracking for field staff (admin-only visibility)

### 🔐 Authentication & Authorization
- Email/password authentication with JWT tokens
- Role-based permissions (Admin, Sales, Support)
- Secure password hashing with bcrypt
- Token-based API authentication

### 📊 Advanced Features
- **Enhanced Search**: Multi-field search across activities (serial numbers, customers, invoices, work orders)
- **CSV Export/Import**: Bulk product operations with warranty data
- **Assignment Management**: Admin capability to reassign activities
- **Edit Permissions**: Granular activity edit controls (creator, assignee, admin only)
- **Mobile Location Tracking**: Silent, automatic background tracking for field staff

### 📱 Mobile Application
- Native Android app (React Native/Expo)
- Silent background location tracking
- Activity management for field staff
- Offline-first architecture

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├──────────────────────────┬──────────────────────────────────┤
│   React Web Dashboard    │   React Native Mobile App        │
│   (Admin, Sales, Support)│   (Field Staff)                  │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               │      REST API (JWT)      │
               │                          │
┌──────────────┴──────────────────────────┴───────────────────┐
│                   BACKEND LAYER                              │
│              FastAPI + Python 3.11                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes:                                              │  │
│  │  • /api/auth          - Authentication               │  │
│  │  • /api/users         - User management              │  │
│  │  • /api/customers     - Customer CRUD                │  │
│  │  • /api/products      - Product master + warranty    │  │
│  │  • /api/activities    - Activity tracking            │  │
│  │  • /api/leads         - Lead management              │  │
│  │  • /api/locations     - GPS tracking                 │  │
│  │  • /api/companies     - Company management           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────┐
│                   DATABASE LAYER                             │
│                   MongoDB 7.0+                               │
│                                                              │
│  Collections: users, customers, products, activities,        │
│               leads, locations, companies                    │
└──────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
/app
├── backend/
│   ├── routes/
│   │   ├── auth_routes.py          # Authentication endpoints
│   │   ├── activity_routes.py      # Activity management
│   │   └── customer_routes.py      # Customer operations
│   ├── utils/
│   │   └── dependencies.py         # Shared utilities
│   ├── server.py                   # Main FastAPI app (Products, Leads, etc.)
│   ├── models.py                   # Pydantic data models
│   ├── auth.py                     # JWT & password utilities
│   ├── rbac.py                     # Role-based access control
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js        # Role-based dashboard
│   │   │   ├── Activities.js       # Activity management (~1500 lines)
│   │   │   ├── ProductsEnhanced.js # Product master
│   │   │   ├── Customers.js        # Customer management
│   │   │   ├── Leads.js            # Lead pipeline
│   │   │   └── LocationTracking.js # Admin-only GPS map
│   │   ├── contexts/
│   │   │   └── AuthContext.js      # Authentication state
│   │   └── components/
│   │       └── ui/                 # Shadcn UI components
│   ├── package.json                # Node dependencies
│   └── tailwind.config.js          # Tailwind CSS config
│
└── crm-mobile/
    ├── src/
    │   ├── screens/                # Mobile screens
    │   ├── services/
    │   │   └── locationService.js  # Background GPS tracking
    │   └── contexts/
    │       └── AuthContext.js      # Auth + auto-start tracking
    ├── app.json                    # Expo configuration
    ├── eas.json                    # EAS Build configuration
    └── package.json                # Mobile dependencies
```

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (PyJWT), bcrypt
- **Validation**: Pydantic v2
- **CORS**: Starlette middleware

### Frontend (Web)
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **State Management**: Context API
- **HTTP Client**: Fetch API
- **Maps**: Leaflet + OpenStreetMap

### Mobile
- **Framework**: React Native (Expo SDK 52)
- **Location**: expo-location (background tracking)
- **Navigation**: React Navigation
- **Storage**: AsyncStorage

### DevOps
- **Containerization**: Docker
- **Process Manager**: Supervisor
- **Hot Reload**: Enabled for frontend & backend

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- MongoDB 7.0+

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-name>
```

### 2. Backend Setup

```bash
cd backend

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=crm_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF

# Install dependencies
pip install -r requirements.txt

# Run backend
python server.py
```

**Backend runs on**: `http://localhost:8001`

### 3. Frontend Setup

```bash
cd frontend

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Install dependencies
yarn install

# Run frontend
yarn start
```

**Frontend runs on**: `http://localhost:3000`

### 4. Mobile App Setup

See [MOBILE_APK_BUILD_GUIDE.md](./MOBILE_APK_BUILD_GUIDE.md) for detailed instructions.

```bash
cd crm-mobile

# Install dependencies
yarn install

# Update backend URL in src/config.js
# Run on Expo Go
npx expo start

# Build APK (requires EAS account)
eas build --platform android --profile preview
```

---

## 📚 Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [USER_DOCUMENTATION.md](./USER_DOCUMENTATION.md) | Complete user manual with feature guides | All Users |
| [QUICK_START.md](./QUICK_START.md) | Quick reference guide | Admin, New Users |
| [MOBILE_APK_BUILD_GUIDE.md](./MOBILE_APK_BUILD_GUIDE.md) | Android build instructions | DevOps, Admin |

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login & get JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### Users

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/{user_id}` | Get user by ID | Admin |
| PUT | `/api/users/{user_id}` | Update user | Admin |
| DELETE | `/api/users/{user_id}` | Delete user | Admin |

### Customers

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/customers` | List customers | All |
| POST | `/api/customers` | Create customer | Sales, Support, Admin |
| GET | `/api/customers/{customer_id}` | Get customer details | All |
| PUT | `/api/customers/{customer_id}` | Update customer | Sales, Admin |
| DELETE | `/api/customers/{customer_id}` | Delete customer | Admin |

### Products

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/products` | List products | All |
| POST | `/api/products` | Create product | Admin |
| GET | `/api/products/{product_id}` | Get product details | All |
| PUT | `/api/products/{product_id}` | Update product | Admin |
| DELETE | `/api/products/{product_id}` | Delete product | Admin |
| GET | `/api/products/export/csv` | Export with warranty data | Admin, Sales |
| POST | `/api/products/import` | Bulk import products | Admin |

### Activities

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/activities` | List all activities | All (filtered by role) |
| POST | `/api/activities` | Create activity | All |
| GET | `/api/activities/{activity_id}` | Get activity details | All |
| PUT | `/api/activities/{activity_id}` | Update activity | Creator, Assignee, Admin |
| DELETE | `/api/activities/{activity_id}` | Delete activity | Admin |
| GET | `/api/activities/search` | Advanced search | All |
| PUT | `/api/activities/{activity_id}/assign` | Reassign activity | Admin |

**Activity Search Parameters**:
- `q` - Search across: product serial, customer name, assigned user, invoice number, work order

### Leads

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/leads` | List leads | Sales, Admin |
| POST | `/api/leads` | Create lead | Sales, Admin |
| GET | `/api/leads/{lead_id}` | Get lead details | Sales, Admin |
| PUT | `/api/leads/{lead_id}` | Update lead | Sales (own), Admin (all) |
| DELETE | `/api/leads/{lead_id}` | Delete lead | Admin |

### Locations

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/locations/user/{user_id}` | Get user's location history | Admin |
| POST | `/api/locations` | Submit location data | Support (auto) |

**Note**: Location tracking is **silent** for Support users. Only Admins can view location data via the web dashboard.

---

## 🚢 Deployment

### Environment Variables

**Backend (.env)**:
```env
MONGO_URL=mongodb://your-mongo-host:27017
DB_NAME=crm_production
JWT_SECRET=your-very-long-random-secret-minimum-32-characters
```

**Frontend (.env)**:
```env
REACT_APP_BACKEND_URL=https://your-api-domain.com
```

### Production Checklist

- [ ] Change all default passwords (see `/app/memory/test_credentials.md`)
- [ ] Set strong `JWT_SECRET` (minimum 32 characters)
- [ ] Configure MongoDB with authentication
- [ ] Enable HTTPS for API and web dashboard
- [ ] Set up MongoDB backups
- [ ] Configure rate limiting on API endpoints
- [ ] Review and restrict CORS origins
- [ ] Enable MongoDB indexes for performance
- [ ] Set up error logging and monitoring

### Database Indexes (Recommended)

```javascript
// MongoDB shell commands
db.users.createIndex({ email: 1 }, { unique: true });
db.activities.createIndex({ serial_number: 1 });
db.activities.createIndex({ customer_id: 1 });
db.activities.createIndex({ assigned_to: 1 });
db.products.createIndex({ serial_number: 1 }, { unique: true });
db.customers.createIndex({ phone: 1 });
db.locations.createIndex({ user_id: 1, timestamp: -1 });
```

---

## 🔒 Security

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Backend validates credentials and generates JWT token
3. Frontend stores token in memory (AuthContext)
4. All subsequent requests include `Authorization: Bearer <token>` header
5. Backend validates token and extracts user info

### Password Security
- Passwords hashed using bcrypt (12 rounds)
- Minimum 6 characters (configurable)
- No password stored in plain text

### Authorization
- Role-based access control (RBAC)
- Endpoint-level permission checks
- Resource ownership validation

### Mobile Security
- Location data encrypted in transit (HTTPS)
- JWT tokens stored securely in AsyncStorage
- Background tracking permission required

---

## 🧪 Testing

### Default Test Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@test.com | admin123 | Full system access |
| Sales | agent@test.com | agent123 | Leads, activities, customers |
| Support | client@test.com | client123 | Activities, customers |
| Support | santhosh@test.com | santhosh123 | Activities, customers |

**⚠️ CRITICAL**: Change these credentials before deploying to production!

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
yarn test

# E2E tests (if configured)
yarn test:e2e
```

---

## 🎨 Design System

**Brand Colors** (Zartec):
- Primary: Dark Blue (`#1e3a8a`)
- Secondary: Dark Green (`#065f46`)
- Accent: Blue-green gradient

**UI Framework**: Shadcn UI + Tailwind CSS

**Typography**:
- H1: `text-4xl sm:text-5xl lg:text-6xl`
- H2: `text-base md:text-lg`
- Body: `text-base`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Key Features Implementation Notes

### Silent Location Tracking
- Implemented in mobile app's `AuthContext.js`
- Automatically starts on successful login for Support users
- Background tracking using `expo-location` with `startLocationUpdatesAsync`
- No UI controls for users to disable (per requirements)
- Admin-only visibility on web dashboard (`LocationTracking.js`)

### Activity Edit Permissions
- Only Admin, Creator, or Assignee can edit activities
- Enforced in both frontend and backend
- Admin has additional capability to reassign activities

### Enhanced Search
- Multi-field search across activities
- Searches: product serial numbers, customer names, assigned users, invoice numbers, work orders
- Real-time filtering on frontend

### Product Warranty Management
- Warranty period tracked in months
- Automatic warranty end date calculation
- Maintenance scheduling
- CSV export includes all warranty data

---

## 📞 Support

For technical support or feature requests, please:
1. Check [USER_DOCUMENTATION.md](./USER_DOCUMENTATION.md) for detailed guides
2. Review [QUICK_START.md](./QUICK_START.md) for common setup issues
3. Open an issue in this repository

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🏆 Acknowledgments

Built with ❤️ using modern web technologies:
- FastAPI team for the excellent Python framework
- React team for the component library
- Expo team for React Native tooling
- MongoDB for the flexible database
- Shadcn for beautiful UI components

---

**Last Updated**: April 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
