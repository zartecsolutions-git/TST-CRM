# 🧪 Minimal Build WITHOUT Location Tracking

## Build Information
- **Status:** ⏳ Building (In Progress)
- **Version:** 1.1.0 (Diagnostic Build)
- **Platform:** Android
- **Profile:** Preview (APK)
- **Build ID:** ecba874f-2beb-4d79-9b11-2a0c26ad0192

## Build URL (Track Progress)
https://expo.dev/accounts/shaijupkt/projects/crm-mobile/builds/ecba874f-2beb-4d79-9b11-2a0c26ad0192

## 🔍 What's Different in This Build

### ❌ REMOVED (To Diagnose Crash):
- expo-location plugin
- All location tracking code
- Location permissions (Android manifest)
- iOS location descriptions
- Background location services

### ✅ KEPT (Core Functionality):
- Login/Auth system
- Dashboard with RBAC
- Activities, Customers, Products, Leads
- Navigation
- Error boundary
- All API calls

## Purpose of This Build
This is a **diagnostic build** to determine if `expo-location` is causing the crash.

### Test Results Will Tell Us:

**If This Build Works:**
- ✅ Problem identified: expo-location plugin is the culprit
- 💡 Solution: Implement custom location tracking or use alternative method
- 🎯 Next step: Build v1.2.0 with alternative location solution

**If This Build Still Crashes:**
- ⚠️ Problem is NOT location-related
- 🔍 Need crash logs via adb to identify real issue
- 🐛 Likely: API connectivity, React Native core issue, or device compatibility

## Expected Build Time
⏱️ **10-15 minutes**

Currently in Free tier queue, may take slightly longer.

## Download & Test Instructions

### Step 1: Download APK
Once build completes (check URL above):
1. Click **"Download"** button
2. Save `crm-mobile-1.1.0.apk`

### Step 2: Install on Android
1. Uninstall previous version if present
2. Install new version
3. Open the app

### Step 3: Test Launch
**What to Check:**
- ✅ Does app open without crashing?
- ✅ Can you see the login screen?
- ✅ Can you login?
- ✅ Does dashboard load?

### Step 4: Test RBAC
If app opens successfully, test roles:

**Support User:**
- Email: `client@test.com` / `client123`
- Should NOT see Products/Leads

**Sales User:**
- Email: `agent@test.com` / `agent123`
- Should see Products/Leads

**Admin User:**
- Email: `admin@test.com` / `admin123`
- Should see all features

## What to Report Back

### Scenario A: App Works! ✅
**Report:** "Minimal build works! App opens and login successful."
**Means:** Location plugin was the problem
**Next:** I'll implement alternative location solution

### Scenario B: Still Crashes ❌
**Report:** "Still crashing on launch"
**Means:** Problem is NOT location-related
**Next:** We MUST get crash logs via adb to proceed

### Scenario C: App Opens but Has Errors ⚠️
**Report:** Describe what error you see
**Next:** I'll fix the specific error

## Features in This Build
✅ Login/Logout
✅ Dashboard with role badge
✅ Activities list & create
✅ Customers management
✅ Products management (Admin/Sales only)
✅ Leads management (Admin/Sales only)
❌ Location tracking (intentionally removed for testing)

## Technical Changes Made

### Files Modified:
1. `/app/crm-mobile/app.json`
   - Removed expo-location plugin
   - Removed location permissions
   - Bumped version to 1.1.0

2. `/app/crm-mobile/src/contexts/AuthContext.js`
   - Removed all location tracking code
   - Clean auth-only implementation

3. `/app/crm-mobile/src/screens/DashboardScreen.js`
   - Removed location tracking comment

### Not Modified:
- All screens (Activities, Customers, Products, Leads)
- Navigation
- API services
- Error boundary
- RBAC logic

---

**Status:** 🟡 Building (Queue: Free tier)  
**ETA:** 10-15 minutes  
**Agent:** Fork Agent (Session 2) - Diagnostic Build
