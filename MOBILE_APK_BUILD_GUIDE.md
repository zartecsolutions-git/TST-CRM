# Mobile APK Build Guide

## Prerequisites

Before building the APK, ensure you have:
- Node.js 18+ installed
- Expo CLI installed globally
- EAS CLI installed globally
- Expo account (free)
- Android device or emulator for testing

## Installation

### 1. Install Required Tools

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally
npm install -g eas-cli

# Navigate to mobile app directory
cd /app/crm-mobile

# Install dependencies (if not already done)
yarn install
```

### 2. Configure Expo Account

```bash
# Login to Expo (create account if needed)
eas login

# Verify login
eas whoami
```

## Build Configuration

The app is already configured with:
- **app.json**: App metadata and permissions
- **eas.json**: Build configurations
- Location tracking permissions
- Background location support

### Build Profiles

Three build profiles are available:

1. **development**: For development testing
2. **preview**: Internal testing APK
3. **production**: Production-ready APK

## Building the APK

### Option 1: Build with EAS (Recommended)

#### Build Preview APK (for testing)

```bash
cd /app/crm-mobile

# Build preview APK
eas build --platform android --profile preview

# Wait for build to complete (10-20 minutes)
# Download APK from provided URL
```

#### Build Production APK

```bash
cd /app/crm-mobile

# Build production APK
eas build --platform android --profile production

# Wait for build to complete
# Download APK from provided URL
```

### Option 2: Local Build (Alternative)

If you prefer building locally:

```bash
cd /app/crm-mobile

# Install dependencies
yarn install

# Build locally (requires Android Studio)
eas build --platform android --local
```

## Build Process

### What Happens During Build:

1. ✅ Dependencies installed
2. ✅ Assets optimized
3. ✅ JavaScript bundled
4. ✅ Native code compiled
5. ✅ APK signed
6. ✅ APK uploaded to Expo servers

### Build Time:
- First build: 15-20 minutes
- Subsequent builds: 10-15 minutes

## After Build Completes

### Download APK

1. EAS CLI will display build URL
2. Open URL in browser
3. Click "Download" button
4. Save APK file (e.g., `crm-mobile-v1.0.0.apk`)

### Build URL Example:
```
https://expo.dev/accounts/[your-account]/projects/crm-mobile/builds/[build-id]
```

## Installing APK on Android Device

### Method 1: Direct Download
1. Transfer APK to Android device
2. Open file manager
3. Tap APK file
4. Allow "Install from unknown sources" if prompted
5. Tap "Install"
6. Open app after installation

### Method 2: ADB Install
```bash
# Connect device via USB
# Enable USB debugging on device

# Install APK
adb install crm-mobile-v1.0.0.apk

# Launch app
adb shell am start -n com.crm.mobile/.MainActivity
```

## Testing the APK

### Pre-Distribution Checklist

- [ ] Login functionality works
- [ ] Activities load correctly
- [ ] Products display properly
- [ ] Customers accessible
- [ ] Location permissions requested
- [ ] Background location tracking starts
- [ ] App doesn't crash on open
- [ ] All tabs navigate correctly
- [ ] Search functions work
- [ ] Data syncs with backend

### Test Accounts

Use these credentials for testing:
- **Support**: santhosh@test.com / santhosh123
- **Support**: client@test.com / client123
- **Sales**: agent@test.com / agent123
- **Admin**: admin@test.com / admin123

## Distributing the APK

### Internal Distribution

**Option 1: Direct File Sharing**
- Email APK to users
- Share via cloud storage (Google Drive, Dropbox)
- Host on internal server

**Option 2: Expo Distribution**
```bash
# Build and share link
eas build --platform android --profile preview

# Share build URL with team
# Users can download directly from Expo
```

**Option 3: Google Play Internal Testing**
```bash
# Build production APK
eas build --platform android --profile production

# Upload to Google Play Console
# Add users to internal testing track
```

### Public Distribution

For public release:
1. Build production APK
2. Create Google Play Console account
3. Upload APK
4. Complete store listing
5. Submit for review
6. Publish to Play Store

## Updating the App

### Version Update Process

1. **Update version in app.json**
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

2. **Build new APK**
```bash
eas build --platform android --profile production
```

3. **Distribute updated APK**
- Users must uninstall old version first (if not using Play Store)
- Or update through Play Store automatically

## Troubleshooting

### Build Fails

**Error: Dependencies issue**
```bash
# Clear cache and reinstall
cd /app/crm-mobile
rm -rf node_modules
yarn install
```

**Error: EAS authentication**
```bash
# Re-login
eas logout
eas login
```

**Error: Build timeout**
- Check internet connection
- Try again (temporary server issue)
- Use `--local` flag for local build

### Installation Issues

**"App not installed" error**
- Uninstall previous version
- Enable "Unknown sources" in settings
- Check storage space

**Location permission not working**
- Ensure permissions added in app.json
- Check Android version (must be 10+)
- Grant location permission manually in settings

**App crashes on start**
- Check backend URL in environment
- Verify API is accessible
- Check device Android version (minimum 10)

## Environment Configuration

### Backend URL Configuration

The app connects to backend API. Ensure correct URL is set:

**File**: `/app/crm-mobile/src/config.js`
```javascript
export const API_BASE_URL = 'https://your-backend-url.com/api';
```

**Before building**, update this with your production backend URL.

## APK Information

### File Details
- **File name**: crm-mobile-vX.X.X.apk
- **Package name**: com.crm.mobile
- **Minimum Android**: 10 (API 29)
- **Target Android**: 13 (API 33)
- **Size**: ~50-80 MB (depending on assets)

### Permissions Required
- Location (foreground and background)
- Internet access
- Network state
- Foreground service

## Security Notes

### APK Signing
- EAS automatically signs APKs
- Uses secure keystore
- Signing key stored on Expo servers
- Same key used for all builds (consistent)

### API Security
- HTTPS enforced
- JWT authentication
- Token stored securely
- Auto-logout on token expiry

## Quick Commands Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK
eas build -p android --profile preview

# Build production APK
eas build -p android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download --latest

# Local build (requires Android Studio)
eas build -p android --local
```

## Support

For build issues:
- Check Expo documentation: https://docs.expo.dev
- EAS Build docs: https://docs.expo.dev/build/introduction
- Contact: support@yourcrm.com

---

## Next Steps

After successful build:

1. ✅ Download APK
2. ✅ Test on physical device
3. ✅ Verify all features work
4. ✅ Distribute to users
5. ✅ Gather feedback
6. ✅ Plan updates based on feedback

---

**Build Status**: Ready to build
**Last Updated**: December 2025
**App Version**: 1.0.0

---

*For deployment support, contact your system administrator.*
