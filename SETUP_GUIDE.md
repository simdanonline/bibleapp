# Bible App - Setup and Getting Started Guide

## What We Built

A fully functional Bible reading application with the following screens:

1. **Home** - Verse of the day and recent verses
2. **Books** - Browse all 66 books of the Bible
3. **Search** - Search verses by keyword
4. **Library** - Your bookmarks and favorites

## File Structure Overview

```
BibleApp/
├── App.tsx                          # Navigation setup
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Home tab - displays verse of day
│   │   ├── BooksScreen.tsx         # Books tab - shows all books
│   │   ├── ChaptersScreen.tsx      # Shows chapters for a book
│   │   ├── ChapterDetailScreen.tsx # Displays verse content
│   │   ├── SearchScreen.tsx        # Search functionality
│   │   └── LibraryScreen.tsx       # Bookmarks & Favorites
│   ├── components/
│   │   ├── VerseCard.tsx           # Reusable verse display component
│   │   ├── SearchBar.tsx           # Search input component
│   │   └── BookList.tsx            # Book listing component
│   ├── services/
│   │   ├── bibleService.ts         # Bible data and API calls
│   │   └── storageService.ts       # Local storage for bookmarks/favorites
│   ├── context/
│   │   └── BibleContext.tsx        # Global state management
│   └── types/
│       └── index.ts                # TypeScript interfaces
└── package.json                    # Dependencies
```

## Key Technologies

- **React Native** - Cross-platform mobile development
- **Expo** - Build and deploy React Native apps easily
- **React Navigation** - Screen navigation and routing
- **AsyncStorage** - Persist user data locally
- **TypeScript** - Type-safe development

## Getting Started

### 1. Start the Development Server

```bash
cd BibleApp
npm start
```

### 2. Choose Your Platform

- Press `i` for iOS (requires macOS)
- Press `a` for Android (requires Android emulator/device)
- Press `w` for web browser

### 3. Hot Reload

The app supports hot reload - save any file and it will automatically refresh!

## How Each Feature Works

### 📖 Home Screen
- Fetches a random "verse of the day"
- Shows 3 recent verses from the same book
- Serves as the welcome screen

### 📚 Books Browser
- Displays all 66 books organized by testament
- Tap a book to see its chapters
- Select a chapter to read verses

### 🔍 Search Feature
- Real-time search as you type
- Debounced search (waits 500ms after you stop typing)
- Returns matching verses with references

### 💾 Bookmarks & Favorites
- Click the bookmark icon to save for later
- Click the heart icon to favorite
- Stored locally in device storage
- Access all saved verses in the Library tab

### 📤 Share Verses
- Tap share icon on any verse
- Uses native share sheet
- Works with messages, email, social media

## Modifying the App

### Change Colors

Open any component file and find `StyleSheet.create()`. The main colors used are:

```javascript
// Primary color (blue)
color: '#6366f1'

// Accent color (red for favorites)
color: '#ef4444'

// Background
backgroundColor: '#f8fafc'
```

### Add More Books/Verses

Edit `src/services/bibleService.ts` and update:
- `BIBLE_BOOKS` array for book data
- `searchVerses()` method for search logic
- `getChapters()` method for verse content

### Connect to Real Bible API

1. Sign up at [scripture.api.bible](https://scripture.api.bible)
2. Get your API key
3. Update `bibleService.ts`:

```typescript
class BibleService {
  private apiKey = 'YOUR_API_KEY_HERE';
  private baseUrl = 'https://api.scripture.api.bible/v1';

  // Implement API calls...
}
```

## Dependencies Installed

```json
{
  "@react-navigation/native": "Navigation library",
  "@react-navigation/bottom-tabs": "Bottom tab navigation",
  "@react-navigation/stack": "Stack navigation",
  "react-native-screens": "Native screen management",
  "react-native-safe-area-context": "Safe area handling",
  "react-native-gesture-handler": "Gesture support",
  "@react-native-async-storage/async-storage": "Local storage",
  "axios": "HTTP requests",
  "expo-vector-icons": "Icon library"
}
```

## Common Issues & Solutions

### App won't start
```bash
# Clear cache and rebuild
npm start -- --clear
# or
expo start --clear
```

### TypeScript errors
```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Navigation not working
- Make sure all screens are imported in `App.tsx`
- Check that screen names match in navigation definition
- Verify the `BibleProvider` wraps the entire app

### Storage not persisting
- AsyncStorage may need permissions
- Check console for errors
- On Android, app data gets cleared on uninstall (normal behavior)

## Next Steps

1. **Test the App** - Run it on iOS/Android and navigate through all screens
2. **Integrate Real Data** - Connect to a Bible API
3. **Add Features** - Dark mode, offline storage, notifications
4. **Deploy** - Build and publish to App Store/Google Play using `eas build`

## Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [React Navigation Docs](https://reactnavigation.org)
- [Bible API Options](https://www.getfantasyfootball.com/xref/niv/list.php)

## Deployment

When ready to publish:

```bash
# Login to Expo
expo login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

---

Happy coding! 🎉
