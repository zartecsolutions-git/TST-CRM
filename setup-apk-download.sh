#!/bin/bash
# CRM Mobile APK - One-Command Setup
# Run this after the build completes to make APK downloadable

echo "🚀 CRM Mobile APK Setup"
echo "======================="
echo ""

APK_SOURCE="/app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk"
APK_DEST="/app/frontend/public/crm-mobile.apk"
DOWNLOAD_URL="https://dept-action-crm-1.preview.emergentagent.com/crm-mobile.apk"

# Check if build is complete
if [ ! -f "$APK_SOURCE" ]; then
    echo "❌ APK not found. Build may still be in progress."
    echo ""
    echo "📊 Build Status:"
    if pgrep -f gradlew > /dev/null; then
        echo "   Gradle is still running ⏳"
        echo ""
        echo "📝 Current activity:"
        tail -3 /tmp/apk_build_v2.log
    else
        echo "   Gradle process stopped ⚠️"
        echo ""
        echo "📝 Last build log:"
        tail -10 /tmp/apk_build_v2.log
        echo ""
        echo "❓ The build may have failed. Check logs at: /tmp/apk_build_v2.log"
    fi
    exit 1
fi

# Build is complete!
echo "✅ APK Build Complete!"
echo ""
echo "📦 APK Details:"
ls -lh "$APK_SOURCE"
echo ""

# Copy to web-accessible location
echo "📋 Copying APK to web folder..."
cp "$APK_SOURCE" "$APK_DEST"

if [ -f "$APK_DEST" ]; then
    echo "✅ APK copied successfully!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📱 DOWNLOAD YOUR APK NOW!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 Download URL:"
    echo "   $DOWNLOAD_URL"
    echo ""
    echo "📋 Instructions:"
    echo "   1. Open this URL on your Android phone"
    echo "   2. Download the APK file"
    echo "   3. Install it (allow unknown sources if needed)"
    echo "   4. Login with:"
    echo "      • Email: admin@test.com"
    echo "      • Password: admin123"
    echo ""
    echo "🎯 Generating QR Code..."
    python3 << 'EOF'
import segno
url = "https://dept-action-crm-1.preview.emergentagent.com/crm-mobile.apk"
qr = segno.make(url, error='h')
print("")
qr.terminal(compact=True)
print("")
print(f"📱 Scan this QR code with your phone to download!")
EOF
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 Your CRM Mobile App is ready!"
else
    echo "❌ Failed to copy APK"
    exit 1
fi
