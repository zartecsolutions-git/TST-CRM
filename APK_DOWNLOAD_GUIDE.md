# 📱 CRM Mobile APK - Download Instructions

## Step 1: Check If Build Is Complete

Run this command to check build status:
```bash
bash /app/check-apk.sh
```

**OR** check directly:
```bash
ls -lh /app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

When you see the file listed, the build is complete! ✅

---

## Step 2: Make APK Downloadable

Once the build completes, run this command to copy the APK to a web-accessible location:

```bash
cp /app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk /app/frontend/public/crm-mobile.apk && \
echo "✅ APK is now ready for download!" && \
ls -lh /app/frontend/public/crm-mobile.apk
```

---

## Step 3: Download APK to Your Phone

### Option A: Direct Download URL
Once Step 2 is complete, open this URL on your Android phone's browser:

```
https://dept-action-crm-1.preview.emergentagent.com/crm-mobile.apk
```

Your phone will download the APK file.

### Option B: QR Code
After completing Step 2, generate a QR code:

```bash
cd /app && python3 << 'EOF'
import segno
url = "https://dept-action-crm-1.preview.emergentagent.com/crm-mobile.apk"
qr = segno.make(url, error='h')
qr.terminal(compact=True)
print(f"\n📱 Scan this QR code to download the APK")
print(f"🌐 URL: {url}")
EOF
```

---

## Step 4: Install APK on Your Android Phone

1. **Download the APK** using the URL or QR code above
2. **Open the downloaded file** (usually in your Downloads folder)
3. **Allow installation from unknown sources** if prompted:
   - Settings → Security → Install unknown apps → Chrome/Browser → Allow
4. **Tap "Install"**
5. **Open the app** once installed

---

## Step 5: Login & Test

Use these credentials to login:

### Admin Account (Full Access)
- **Email:** admin@test.com
- **Password:** admin123
- **Features:** Dashboard, Activities, Location Tracking, User Management

### Agent Account
- **Email:** agent@test.com
- **Password:** agent123
- **Features:** Activities, Location Tracking

### Client Account
- **Email:** client@test.com
- **Password:** client123
- **Features:** View assigned activities

---

## 🧪 What to Test

1. ✅ **Login** - Test all three user roles
2. ✅ **Dashboard** - Check role-based UI differences
3. ✅ **Activities** - Create, update, view activities
4. ✅ **Location Tracking** - Enable location and test tracking
5. ✅ **Progress Updates** - Add multi-stage progress to activities
6. ✅ **Navigation** - Test bottom tab navigation

---

## 📊 Build Monitoring

**Estimated completion time:** 10-15 minutes from when you last checked

**Quick status check:**
```bash
# Simple one-liner to check if APK exists
[ -f /app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk ] && echo "✅ BUILD COMPLETE!" || echo "⏳ Still building..."
```

**Check build logs:**
```bash
tail -20 /tmp/apk_build_v2.log
```

**Check if Gradle is still running:**
```bash
ps aux | grep gradlew | grep -v grep
```

---

## ⚠️ Troubleshooting

### If Build Fails
Check the build log:
```bash
tail -100 /tmp/apk_build_v2.log
```

### If APK Won't Install
- Make sure "Install from Unknown Sources" is enabled
- Try downloading again - file might be corrupted
- Check your phone has enough storage space (APK is ~50-80 MB)

### If App Crashes on Startup
- Clear app data: Settings → Apps → CRM Mobile → Clear Data
- Reinstall the app
- Check that backend is running at: https://dept-action-crm-1.preview.emergentagent.com/api

---

## 🎯 Quick Command Summary

```bash
# 1. Check if build is complete
bash /app/check-apk.sh

# 2. Copy APK to downloadable location
cp /app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk /app/frontend/public/crm-mobile.apk

# 3. Download from your phone's browser
# https://dept-action-crm-1.preview.emergentagent.com/crm-mobile.apk
```

---

## 📦 APK Details

- **Package Name:** com.crm.mobile
- **Version:** 1.0.0
- **Size:** ~50-80 MB (estimated)
- **Min Android Version:** Android 8.0 (API 24) and above
- **Architectures:** arm64-v8a, armeabi-v7a, x86, x86_64 (universal APK)

---

**Need help?** Check the build logs or re-run the build process if needed.

**Enjoy your CRM Mobile App! 🎉**
