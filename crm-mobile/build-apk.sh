#!/bin/bash

echo "🚀 CRM Mobile APK Build Script"
echo "================================"
echo ""

# Check if user is logged in to Expo
echo "Step 1: Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to Expo"
    echo ""
    echo "Please login first:"
    echo "  eas login"
    echo ""
    echo "Don't have an Expo account?"
    echo "  Create one at: https://expo.dev/signup"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# Configure project if needed
echo "Step 2: Configuring project..."
if [ ! -f "eas.json" ]; then
    eas build:configure
else
    echo "✅ Project already configured"
fi
echo ""

# Start the build
echo "Step 3: Starting Android APK build..."
echo "This will take approximately 10-15 minutes."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    eas build -p android --profile preview
    echo ""
    echo "🎉 Build started successfully!"
    echo "You'll receive a download link when the build completes."
    echo "You can also check build status at: https://expo.dev/"
else
    echo "Build cancelled."
    exit 0
fi
