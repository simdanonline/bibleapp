#!/bin/bash

# Bible App Quick Start Script
# This script helps you get the Bible app running quickly

echo "🙏 Welcome to Bible App - React Native Expo"
echo "============================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

echo "✅ npm found"
echo ""

# Check if already in the BibleApp directory
if [ ! -f "package.json" ]; then
    echo "📁 Navigating to BibleApp directory..."
    if [ -d "BibleApp" ]; then
        cd BibleApp
    else
        echo "❌ Could not find BibleApp directory"
        exit 1
    fi
fi

echo "📦 Installing dependencies (if needed)..."
npm install 2>/dev/null

echo ""
echo "🚀 Starting Bible App!"
echo ""
echo "Select your platform:"
echo "  i - iOS"
echo "  a - Android"
echo "  w - Web"
echo "  q - Quit"
echo ""

npm start
