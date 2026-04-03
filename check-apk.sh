#!/bin/bash
# Quick APK Build Status Checker

APK="/app/crm-mobile/android/app/build/outputs/apk/debug/app-debug.apk"

echo "🔍 CRM Mobile APK Build Status"
echo "================================"
echo ""

if [ -f "$APK" ]; then
    echo "✅ ✅ ✅ BUILD COMPLETE! ✅ ✅ ✅"
    echo ""
    echo "📦 APK Details:"
    ls -lh "$APK"
    echo ""
    echo "📍 Location: $APK"
    echo ""
    echo "💾 Size: $(du -h "$APK" | cut -f1)"
    echo ""
    echo "📥 To download, copy this file to a web-accessible location or use:"
    echo "   cp '$APK' /app/frontend/public/crm-mobile.apk"
else
    echo "⏳ Build Still In Progress..."
    echo ""
    echo "📊 Current Activity:"
    tail -3 /tmp/apk_build_v2.log
    echo ""
    echo "🔄 Gradle Process:"
    if pgrep -f gradlew > /dev/null; then
        echo "   Status: RUNNING ✓"
    else
        echo "   Status: STOPPED (checking if build completed...)"
    fi
    echo ""
    echo "⏱️  This process typically takes 20-30 minutes total"
    echo "💡 Run this script again in a few minutes to check progress"
fi
