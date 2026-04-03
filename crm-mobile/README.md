# CRM Mobile Application

React Native mobile app for the CRM system with real-time location tracking and activity management.

## Features

✅ **Authentication**
- Email/Password login
- JWT token management
- Auto-login

✅ **Activities Management**
- View all assigned activities
- Filter by status (Pending, In Progress, Completed)
- Create new activities
- Multi-stage progress tracking with percentage
- Status updates with required notes

✅ **Background Location Tracking**
- Continuous GPS tracking (every 1 minute or 50 meters)
- Runs in background even when app is closed
- Sends location to backend API
- Visual tracking indicator

✅ **Design**
- Blue & Green gradient theme
- Material Design components
- Role-based UI (Admin, Agent, Client)

## Setup

### Prerequisites
- Node.js 20+
- Expo CLI
- Android Studio (for Android)
- Android device or emulator

### Installation

```bash
cd /app/crm-mobile
npm install
```

### Running the App

**On Android Device/Emulator:**
```bash
npm run android
```

**In Web Browser (limited features):**
```bash
npm run web
```

**Development Server:**
```bash
npm start
```

Then scan QR code with Expo Go app on your phone.

## Configuration

### Backend API URL

Update the API URL in `/src/services/api.js`:

```javascript
const API_URL = 'https://dept-action-crm-1.preview.emergentagent.com/api';
```

Replace with your actual backend URL.

## Test Credentials

```
Admin:  admin@test.com  / admin123
Agent:  agent@test.com  / agent123
Client: client@test.com / client123
```

## Building APK

### Development Build
```bash
expo build:android
```

### Production Build
```bash
eas build --platform android
```

## Permissions

The app requests:
- **Location (Foreground)** - Track location when app is open
- **Location (Background)** - Track location when app is closed
- **Foreground Service** - Keep tracking active

## Project Structure

```
src/
├── screens/
│   ├── LoginScreen.js           # Login page
│   ├── DashboardScreen.js       # Home with location toggle
│   ├── ActivitiesScreen.js      # Activity list with progress
│   └── CreateActivityScreen.js  # Create new activity
├── services/
│   ├── api.js                   # Backend API integration
│   └── locationService.js       # GPS tracking service
├── contexts/
│   └── AuthContext.js           # Authentication state
├── navigation/
│   └── AppNavigator.js          # Screen navigation
└── utils/
    └── colors.js                # Blue/Green theme
```

## Features in Detail

### Multi-Stage Progress Tracking

When an activity is "In Progress", you can:
1. Click "+ Add Progress"
2. Enter progress details
3. Set completion percentage (0-100%)
4. Submit
5. Add unlimited progress stages
6. All stages visible in activity card

### Background Location Tracking

1. Go to Dashboard
2. Click "Start Tracking"
3. Grant location permissions (foreground + background)
4. App tracks location every 1 minute or 50 meters
5. Location sent to backend API automatically
6. Works even when app is closed!

## Troubleshooting

**Location not working:**
- Make sure you granted BOTH foreground and background permissions
- Check Settings > Apps > CRM Mobile > Permissions > Location > Allow all the time

**Can't connect to backend:**
- Update API_URL in `/src/services/api.js`
- Make sure backend is running and accessible

**App won't start:**
```bash
rm -rf node_modules
npm install
npm start --clear
```

## License

Proprietary - All rights reserved
