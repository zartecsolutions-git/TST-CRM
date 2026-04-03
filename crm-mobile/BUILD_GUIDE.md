# CRM Mobile App - Testing & Build Guide

## 🚀 Quick Testing Options

### Option 1: Browser Testing (Available NOW!)
Open your mobile phone's browser and visit:
```
https://dept-action-crm-1.preview.emergentagent.com:8081
```

**Test Credentials:**
- Admin: admin@test.com / admin123
- Agent: agent@test.com / agent123
- Client: client@test.com / client123

**Features Available:**
- ✅ Login/Authentication
- ✅ Role-based Dashboard (Admin/Agent/Client)
- ✅ Activities Management
- ✅ Location Tracking
- ✅ Create/Update Activities
- ✅ Progress Tracking

---

## 📱 Option 2: Build Native Android APK

### Prerequisites
1. Create a free Expo account at: https://expo.dev/signup
2. Install Expo CLI globally (already done in this project)

### Step-by-Step Build Instructions

#### Step 1: Login to Expo
```bash
cd /app/crm-mobile
eas login
```
Enter your Expo account credentials when prompted.

#### Step 2: Configure the Project
```bash
eas build:configure
```
This will link your project to your Expo account.

#### Step 3: Build the APK
```bash
eas build -p android --profile preview
```

This will:
- Upload your code to Expo's build servers
- Build a native Android APK
- Provide a download link when complete (usually 10-15 minutes)

#### Step 4: Download and Install
1. Once the build completes, you'll get a download URL
2. Open the URL on your Android phone
3. Download the `.apk` file
4. Install it (you may need to allow installation from unknown sources)

---

## 🔧 Alternative: Local APK Build (No Expo Account Required)

If you prefer not to create an Expo account, you can build locally:

```bash
cd /app/crm-mobile
npx expo export --platform android
```

This creates an optimized bundle that can be tested with Expo Go app.

---

## 📖 App Architecture

### Backend Connection
The app connects to: `https://dept-action-crm-1.preview.emergentagent.com/api`

Configuration: `/app/crm-mobile/src/services/api.js`

### Key Features
1. **Authentication**: JWT-based login
2. **Role-Based Access Control**: Admin, Agent, Client roles
3. **Location Tracking**: Real-time GPS tracking with background support
4. **Activities Management**: Create, update, track progress
5. **Multi-stage Progress**: Add updates during activity execution

### Tech Stack
- React Native with Expo
- React Navigation for routing
- Axios for API calls
- Expo Location for GPS tracking
- AsyncStorage for local data

---

## 🐛 Troubleshooting

### "App not loading in browser"
- Ensure the Expo server is running: `npm run web`
- Clear browser cache and retry
- Check that port 8081 is accessible

### "Cannot connect to backend"
- Verify backend is running at the production URL
- Check network connectivity
- Ensure API endpoints include `/api` prefix

### "Location not working"
- Grant location permissions when prompted
- For Android: Settings > Apps > CRM Mobile > Permissions > Location > Allow all the time

---

## 📞 Support

For build issues or questions, refer to:
- Expo Documentation: https://docs.expo.dev/
- EAS Build Guide: https://docs.expo.dev/build/introduction/

---

**Built with ❤️ using React Native and Expo**
