#!/bin/bash
# Bible App - Quick Command Reference

# ============================================
# 🙏 BIBLE APP - COMMAND REFERENCE
# ============================================

# NAVIGATION
cd /Users/similoluwa/Documents/codes/vibe-coding/bible/BibleApp

# ============================================
# 🚀 STARTING THE APP
# ============================================

# Start development server
npm start

# With clear cache
npm start -- --clear

# ============================================
# 📱 RUNNING ON SPECIFIC PLATFORMS
# ============================================

# After running 'npm start', press:
# i - iOS
# a - Android  
# w - Web

# Or run directly:
npm run ios
npm run android
npm run web

# ============================================
# 📦 PACKAGE MANAGEMENT
# ============================================

# Install dependencies
npm install

# Install specific package
npm install package-name

# Update packages
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# ============================================
# 🧹 MAINTENANCE
# ============================================

# Clear cache
npm start -- --clear
# or
expo start --clear

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Reset Expo
expo start -c

# ============================================
# 🔧 DEVELOPMENT TOOLS
# ============================================

# Type-check TypeScript
npx tsc --noEmit

# Format code (if prettier installed)
npx prettier --write "src/**/*.{ts,tsx}"

# ============================================
# 📊 PROJECT STRUCTURE
# ============================================

# View project structure
tree -I 'node_modules'

# Count lines of code
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l

# ============================================
# 🚀 BUILDING FOR PRODUCTION
# ============================================

# Build for iOS (requires eas)
eas build --platform ios

# Build for Android
eas build --platform android

# Preview build
eas build --platform ios --profile preview

# ============================================
# 📱 DEPLOYING TO APP STORES
# ============================================

# Install EAS CLI
npm install -g eas-cli

# Login to Expo/EAS
eas login

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android

# ============================================
# 🔍 DEBUGGING
# ============================================

# View logs from Expo
expo logs

# Device logs (iOS)
xcrun simctl spawn booted log stream --predicate 'process == "BibleApp"'

# Device logs (Android)
adb logcat

# ============================================
# 📚 DOCUMENTATION
# ============================================

# View project README
cat README.md

# View setup guide
cat SETUP_GUIDE.md

# View features
cat FEATURES.md

# View project summary
cat PROJECT_SUMMARY.md

# ============================================
# 💡 USEFUL SHORTCUTS
# ============================================

# Make start script executable
chmod +x start-app.sh

# Run start script
./start-app.sh

# Open in VS Code
code .

# ============================================
# 🎯 COMMON WORKFLOWS
# ============================================

# Complete setup from scratch:
# 1. Navigate to directory
cd /Users/similoluwa/Documents/codes/vibe-coding/bible/BibleApp

# 2. Install dependencies
npm install

# 3. Start dev server
npm start

# 4. Press 'i' for iOS or 'a' for Android

# ============================================
# 🛠️ TROUBLESHOOTING COMMANDS
# ============================================

# Clear everything and restart
rm -rf node_modules package-lock.json .expo
npm install
npm start -- --clear

# Kill running Expo process
lsof -i :19000
kill -9 <PID>

# Check if ports are in use
lsof -i :19000
lsof -i :19001

# ============================================
# 📝 FILE LOCATIONS
# ============================================

# Main app file
# App.tsx

# Navigation setup
# App.tsx

# Screens
# src/screens/*.tsx

# Components
# src/components/*.tsx

# Services
# src/services/*.ts

# Context
# src/context/*.tsx

# Types
# src/types/index.ts

# ============================================
# 🎨 CONFIGURATION FILES
# ============================================

# Expo config
# app.json

# Dependencies
# package.json

# TypeScript config
# tsconfig.json

# ============================================
# 📦 KEY DEPENDENCIES
# ============================================

# Navigation: @react-navigation/native
# Tab navigation: @react-navigation/bottom-tabs
# Stack navigation: @react-navigation/stack
# Local storage: @react-native-async-storage/async-storage
# Icons: @expo/vector-icons
# HTTP: axios

# ============================================
# ✨ QUICK START (3 COMMANDS)
# ============================================

cd /Users/similoluwa/Documents/codes/vibe-coding/bible/BibleApp
npm install
npm start

# Then press 'i' or 'a' to run on iOS or Android

# ============================================
