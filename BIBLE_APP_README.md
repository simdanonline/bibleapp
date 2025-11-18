# Bible App - React Native Expo

A beautiful and feature-rich Bible reading application built with React Native and Expo.

## Features

- **Home Screen**: Displays verse of the day and recent verses
- **Books Browser**: Browse all 66 books of the Bible organized by Old and New Testament
- **Chapter Navigation**: View chapters within each book and read verses
- **Search**: Search for verses across the entire Bible
- **Bookmarks**: Save important verses for quick access
- **Favorites**: Mark your favorite verses with a heart
- **Share**: Share verses with friends via text, email, or social media
- **Local Storage**: All bookmarks and favorites are saved locally on your device

## Project Structure

```
BibleApp/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── HomeScreen.tsx
│   │   ├── BooksScreen.tsx
│   │   ├── ChaptersScreen.tsx
│   │   ├── ChapterDetailScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   └── LibraryScreen.tsx
│   ├── components/        # Reusable components
│   │   ├── VerseCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── BookList.tsx
│   ├── services/          # Business logic and APIs
│   │   ├── bibleService.ts
│   │   └── storageService.ts
│   ├── context/           # React Context for state management
│   │   └── BibleContext.tsx
│   └── types/             # TypeScript types and interfaces
│       └── index.ts
├── App.tsx                # Main app entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Installation

1. Navigate to the project directory:
```bash
cd BibleApp
```

2. Install dependencies (already done during setup):
```bash
npm install
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

### Development Server
```bash
npm start
```

Then press:
- `i` for iOS
- `a` for Android
- `w` for web

## Dependencies

- **@react-navigation**: Navigation library for React Native
- **react-native-screens**: Native stack navigation
- **react-native-safe-area-context**: Handle safe area on notched devices
- **react-native-gesture-handler**: Gesture handling
- **@react-native-async-storage/async-storage**: Local data persistence
- **axios**: HTTP client (for future API integration)
- **expo-vector-icons**: Icon library

## Features Explained

### 1. Home Screen
- Displays a "Verse of the Day" with full text
- Shows recent verses for quick access
- Clean and welcoming interface

### 2. Books Browser
- Complete list of all 66 Bible books
- Organized by Old Testament (39 books) and New Testament (27 books)
- Tap any book to view its chapters

### 3. Chapter Reader
- Beautiful, readable verse display
- Organized verse layout with verse numbers
- Quick access buttons for each verse

### 4. Search Functionality
- Real-time search as you type
- Search across all verses
- Results display with reference information

### 5. Bookmarks & Favorites
- Bookmark important verses for later
- Mark favorite verses with a heart
- View all saved verses in the Library tab
- Remove bookmarks/favorites with a tap

### 6. Sharing
- Share any verse via the built-in share menu
- Format includes verse reference and text
- Works with all sharing apps on your device

## Customization

### Adding Real Bible Data
Currently, the app uses mock data. To integrate real Bible data:

1. Sign up for a free Bible API (e.g., scripture.api.bible)
2. Update `src/services/bibleService.ts` with your API key
3. Implement the API calls in the `getChapters()` and `searchVerses()` methods

### Styling
- Primary color: `#6366f1` (Indigo)
- Accent color: `#ef4444` (Red for favorites)
- Modify colors in component `StyleSheet.create()` calls

### Adding More Features
- Daily notifications for verse of the day
- Verse comparisons across versions
- Offline Bible storage
- User authentication and cloud sync
- Bible study plans and devotionals

## Future Enhancements

- [ ] Multiple Bible versions (KJV, NIV, ESV, etc.)
- [ ] Offline mode with downloadable versions
- [ ] Bible reading plans
- [ ] Verse notes and commentary
- [ ] Social features (share highlights with friends)
- [ ] Dark mode
- [ ] Text-to-speech Bible reading
- [ ] Daily notifications for verse of the day

## Troubleshooting

**Issue: Build fails with TypeScript errors**
- Run `npm install` to ensure all dependencies are installed
- Clear cache: `npm start -- --clear`

**Issue: App crashes on startup**
- Check that all imports are correct
- Ensure `BibleProvider` wraps the entire app in `App.tsx`

**Issue: Navigation not working**
- Verify all screens are registered in the navigation stack
- Check that screen names match in navigation and screen definitions

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to fork this project and submit pull requests.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React Native and Expo
