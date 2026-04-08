# Mobile App Build Instructions (Windows)

## Issue
```
Failed to resolve plugin for module "expo-location" relative to "C:\Emergent\CRM\CRM\crm-mobile". 
Do you have node modules installed?
```

## Root Cause
Dependencies are not properly installed on your local Windows machine.

---

## ✅ SOLUTION: Build Steps for Windows

### Step 1: Install Dependencies
```powershell
cd C:\Emergent\CRM\CRM\crm-mobile

# Delete existing node_modules and lock files (if any)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item yarn.lock -ErrorAction SilentlyContinue

# Install using npm (since you might not have yarn on Windows)
npm install

# OR if you have yarn installed:
# yarn install
```

### Step 2: Clear Expo Cache
```powershell
npx expo start --clear
```
Press `Ctrl+C` to stop after it starts successfully.

### Step 3: Login to EAS (if not already logged in)
```powershell
npx eas login
```
Enter your Expo credentials.

### Step 4: Build APK
```powershell
npx eas build --platform android --profile preview
```

---

## Alternative: Build from the Pod Environment (Recommended)

If the Windows build continues to have issues, you can build directly from the Emergent pod:

### In the Emergent Chat Interface, ask:
```
Please build the Android APK for the mobile app using EAS CLI from the pod environment
```

The agent will run:
```bash
cd /app/crm-mobile
eas build --platform android --profile preview
```

This ensures all dependencies are exactly as configured in the pod.

---

## 🔍 Verify Installation Before Building

Run this to check if dependencies are installed correctly:
```powershell
cd C:\Emergent\CRM\CRM\crm-mobile

# Check if expo-location is installed
npm list expo-location

# Should show:
# crm-mobile@1.0.0 C:\Emergent\CRM\CRM\crm-mobile
# └── expo-location@55.1.6
```

---

## Expected Output After Successful Build

After `eas build` command:
1. EAS will upload your code
2. Build will start on Expo's servers
3. You'll get a link to track build progress
4. Once complete, you'll get a download link for the APK file

**Build time:** Usually 10-15 minutes

---

## Common Issues & Fixes

### Issue 1: "expo-cli not found"
**Fix:**
```powershell
npm install -g eas-cli
```

### Issue 2: "Failed to authenticate"
**Fix:**
```powershell
npx eas login
```

### Issue 3: Node/npm version issues
**Fix:** Ensure you have Node.js 18+ and npm 9+
```powershell
node --version  # Should be v18 or higher
npm --version   # Should be 9 or higher
```

---

## Testing After APK Install

Once you have the APK installed on your Android device:

### Test Credentials:
- **Support:** `client@test.com` / `client123`
  - ✅ Should see: Activities, Create Activity, Customers, Logout
  - ❌ Should NOT see: Products, Leads

- **Sales:** `agent@test.com` / `agent123`
  - ✅ Should see: Activities, Create Activity, Customers, **Products**, **Leads**, Logout

- **Admin:** `admin@test.com` / `admin123`
  - ✅ Should see: All features including Products and Leads

---

## Need Help?

If you continue to face issues, share:
1. Your Node.js version: `node --version`
2. Your npm version: `npm --version`
3. Full error output from the build command
