# 📱 Build Your CRM Mobile APK - Step-by-Step Guide

## ✅ Prerequisites Completed
- ✅ EAS CLI installed globally
- ✅ Mobile app configured with location tracking
- ✅ Backend API URL configured: `https://dept-action-crm-1.preview.emergentagent.com/api`

---

## 🚀 Quick Build Instructions (2 Options)

### Option 1: Build in Cloud (Recommended - Easiest)

This builds the APK on Expo's servers. You just need an Expo account (free).

#### Step 1: Login to Expo
```bash
cd /app/crm-mobile
eas login
```

**If you don't have an Expo account:**
- Enter a new email/password when prompted
- OR visit https://expo.dev/signup to create one first

#### Step 2: Build the APK
```bash
eas build --platform android --profile preview
```

**What happens:**
1. EAS uploads your code to Expo servers
2. Expo builds the APK (takes 10-20 minutes)
3. You get a download link when done

#### Step 3: Download APK
- EAS will show a URL like: `https://expo.dev/accounts/[username]/projects/crm-mobile/builds/[id]`
- Open that URL in your browser
- Click "Download" to get the `.apk` file
- File will be named something like: `crm-mobile-1.0.0.apk`

---

### Option 2: Build Locally (Advanced - Requires Android Studio)

Only use this if you have Android Studio installed and configured.

```bash
cd /app/crm-mobile
eas build --platform android --local --profile preview
```

---

## 📥 Install APK on Android Device

### Method 1: Direct Install (Easiest)
1. Transfer the `.apk` file to your Android phone (via email, Google Drive, USB, etc.)
2. Open the file on your phone
3. If prompted, allow "Install from unknown sources"
4. Tap "Install"
5. Open the app after installation

### Method 2: Install via ADB (For Developers)
```bash
# Connect phone via USB (enable USB debugging)
adb install crm-mobile-1.0.0.apk
```

---

## 🧪 Testing the APK After Installation

### 1. Login as Support User
- Open the CRM Mobile app
- Login with: `client@test.com` / `client123`

### 2. Grant Location Permission
- When prompted, allow location access
- Select "Allow all the time" for background tracking

### 3. Verify Features
- ✅ Dashboard loads
- ✅ Activities list appears
- ✅ Can create new activity
- ✅ Location tracking starts automatically (silent)

### 4. Verify Location Tracking (Admin View)
- Open web dashboard at: https://dept-action-crm-1.preview.emergentagent.com
- Login as admin: `admin@test.com` / `admin123`
- Navigate to "Location Tracking" page
- Select the support user from dropdown
- Map should show location points

---

## 🔧 Troubleshooting

### Build Fails with "Not logged in"
```bash
eas login
eas whoami  # Verify login
```

### Build Fails with "Project not configured"
```bash
cd /app/crm-mobile
eas build:configure
```

### APK Won't Install on Phone
- Enable "Install from unknown sources" in Android settings
- Check Android version is 8.0+ (minimum requirement)

### Location Tracking Not Working
- Ensure location permission is set to "Allow all the time"
- Check that user is logged in as Support role
- Verify backend API is accessible from mobile network

### App Shows "Network Error"
- Check that backend URL is correct in `/app/crm-mobile/src/services/api.js`
- Current URL: `https://dept-action-crm-1.preview.emergentagent.com/api`
- Ensure backend is running and accessible

---

## 📝 Build Profiles Explained

### Preview (Recommended for Testing)
```bash
eas build --platform android --profile preview
```
- Builds `.apk` file (easy to distribute)
- Internal testing only
- Not signed for Google Play Store

### Production (For Play Store)
```bash
eas build --platform android --profile production
```
- Builds `.aab` file (Android App Bundle)
- Requires Google Play Store signing keys
- Use this only when ready to publish to Play Store

---

## 🎯 Expected Output from EAS Build

```
✔ Using remote Android credentials (Expo server)
✔ Uploading project to Expo
✔ Queued build
✔ Build started
✔ Build completed!

📦 APK: https://expo.dev/accounts/yourname/projects/crm-mobile/builds/abc123def456

Build details: https://expo.dev/accounts/yourname/projects/crm-mobile/builds/abc123def456
```

**Important**: Save that URL! You'll use it to download the APK.

---

## 🔐 Security Notes

### Current Configuration
- Backend URL is **hardcoded** in `src/services/api.js`
- Points to: `https://dept-action-crm-1.preview.emergentagent.com/api`

### For Production
If you deploy to a different backend URL, update the API URL:

```javascript
// File: /app/crm-mobile/src/services/api.js
const API_URL = 'https://your-production-backend.com/api';
```

Then rebuild the APK with the new URL.

---

## 📱 Distribution Options

### Internal Testing (Current)
- Share APK file directly with field staff
- No app store required
- Users must enable "Install from unknown sources"

### Google Play Store (Future)
1. Build with `--profile production`
2. Create Google Play Developer account ($25 one-time fee)
3. Upload `.aab` file to Play Console
4. Fill out store listing
5. Submit for review

### Enterprise Distribution (Alternative)
- Use MDM (Mobile Device Management) solution
- Deploy to company-owned devices
- No user action required for installation

---

## 🆘 Need Help?

### Common Questions

**Q: How long does the build take?**
A: 10-20 minutes for first build, 10-15 minutes for subsequent builds

**Q: Do I need to pay for Expo?**
A: No, the free tier includes unlimited builds

**Q: Can I build for iOS?**
A: Yes, but requires a Mac computer or Expo EAS build service (requires Apple Developer account, $99/year)

**Q: How do I update the app later?**
A: Rebuild with new version number in `app.json`, then redistribute the new APK

**Q: Can users see location tracking?**
A: No, tracking is **silent** by design. Only admins can view location data on web dashboard.

---

## ✅ Build Checklist

Before building:
- [ ] Verified backend API is running and accessible
- [ ] Tested API URL in browser: https://dept-action-crm-1.preview.emergentagent.com/api/auth/me
- [ ] Have Expo account credentials ready
- [ ] Decided on distribution method (direct APK or Play Store)

During build:
- [ ] Run `eas login`
- [ ] Run `eas build --platform android --profile preview`
- [ ] Wait for build to complete (~15 minutes)
- [ ] Copy download URL

After build:
- [ ] Download APK from build URL
- [ ] Install on test device
- [ ] Test login, activities, and location tracking
- [ ] Distribute to field staff

---

## 🎉 You're Ready!

Run this command to start building:

```bash
cd /app/crm-mobile && eas login && eas build --platform android --profile preview
```

The build will run in the background on Expo's servers. You can close the terminal and check status at https://expo.dev/accounts/[your-username]/builds

---

**Last Updated**: April 2024  
**App Version**: 1.0.0  
**Build Profile**: Preview (Internal Testing)
