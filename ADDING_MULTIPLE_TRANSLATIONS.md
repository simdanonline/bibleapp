# Adding Multiple Bible Translations Guide

## Overview
The Bible app is now ready to support multiple translations. Here's a step-by-step guide to add ESV, NASB, NLT, NIV, and other versions.

## Available Translations

From the [jadenzaleski/bible-translations](https://github.com/jadenzaleski/bible-translations) repository, these translations are available:

| Abbreviation | Name | License | Status |
|---|---|---|---|
| AKJV | American King James Version | Public Domain | ✅ Free |
| AMP | Amplified Bible | Proprietary | ⚠️ Check |
| ASV | American Standard Version | Public Domain | ✅ Free |
| ESV | English Standard Version | Proprietary | ⚠️ Check |
| KJV | King James Version | Public Domain | ✅ Included |
| NASB | New American Standard Bible | Proprietary | ⚠️ Check |
| NET | New English Translation | Open License | ✅ Free |
| NIV | New International Version | Proprietary | ⚠️ Check |
| NKJV | New King James Version | Proprietary | ⚠️ Check |
| NLT | New Living Translation | Proprietary | ⚠️ Check |
| NRSV | New Revised Standard Version | Public Domain | ✅ Free |
| WEB | World English Bible | Public Domain | ✅ Free |
| YLT | Young's Literal Translation | Public Domain | ✅ Free |

## Step 1: Download Additional Translations

```bash
cd /Users/similoluwa/Documents/codes/vibe-coding/bible/BibleApp/assets/bible

# Public Domain versions (safe to include)
curl -L -o ASV_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/ASV/ASV_bible.json
curl -L -o NET_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/NET/NET_bible.json
curl -L -o NRSV_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/NRSV/NRSV_bible.json
curl -L -o WEB_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/WEB/WEB_bible.json
curl -L -o YLT_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/YLT/YLT_bible.json

# Recommended proprietary (verify rights first)
curl -L -o NKJV_bible.json https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/NKJV/NKJV_bible.json
```

## Step 2: Update BibleService to Support Multiple Versions

```typescript
// src/services/BibleService.ts

class BibleService {
  private cachePrefix = "bible_cache_";
  private chapterCachePrefix = "chapter_cache_";
  private bibleVersions: { [version: string]: BibleData } = {};
  private currentVersion = "KJV";

  // Load all available versions
  private async loadAllVersions(): Promise<void> {
    const versions = ["KJV", "NKJV", "ESV", "NASB", "NLT", "NET", "WEB"];
    
    for (const version of versions) {
      try {
        const fileName = `${version}_bible.json`;
        // Dynamically require based on version
        this.bibleVersions[version] = require(`../../assets/bible/${fileName}`);
      } catch (error) {
        console.warn(`Could not load ${version} version:`, error);
      }
    }
  }

  // Update getChapters to use version parameter
  async getChapters(
    bookName: string, 
    chapterNumber: number, 
    version: string = this.currentVersion
  ): Promise<Chapter> {
    const data = this.bibleVersions[version];
    
    if (!data) {
      console.warn(`Version ${version} not available`);
      return this.getMockChapter(bookName, chapterNumber);
    }

    // ... rest of method using data instead of this.bibleDataCache
  }

  // Add version setter
  setCurrentVersion(version: string): void {
    if (this.bibleVersions[version]) {
      this.currentVersion = version;
      console.log(`Version changed to: ${version}`);
    } else {
      console.warn(`Version ${version} not available`);
    }
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getAvailableVersions(): string[] {
    return Object.keys(this.bibleVersions);
  }
}
```

## Step 3: Update BibleContext

```typescript
// src/contexts/BibleContext.tsx

interface BibleContextType {
  currentVersion: string;
  setCurrentVersion: (version: string) => void;
  availableVersions: string[];
  // ... rest of context
}

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentVersion, setCurrentVersion] = useState("KJV");
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  useEffect(() => {
    // Get available versions from BibleService
    const versions = bibleService.getAvailableVersions();
    setAvailableVersions(versions);
  }, []);

  const handleSetVersion = (version: string) => {
    if (availableVersions.includes(version)) {
      setCurrentVersion(version);
      bibleService.setCurrentVersion(version);
      storageService.setCurrentVersion(version); // Persist preference
    }
  };

  return (
    <BibleContext.Provider value={{
      currentVersion,
      setCurrentVersion: handleSetVersion,
      availableVersions,
      // ...
    }}>
      {children}
    </BibleContext.Provider>
  );
};
```

## Step 4: Update SettingsScreen

```typescript
// app/(tabs)/settings.tsx

export default function SettingsScreen() {
  const { useBible } = useContext(BibleContext);
  const { currentVersion, setCurrentVersion, availableVersions } = useBible();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Section title="Bible Version">
          {availableVersions.map((version) => (
            <TouchableOpacity
              key={version}
              style={styles.versionItem}
              onPress={() => setCurrentVersion(version)}
            >
              <Text
                style={[
                  styles.versionName,
                  currentVersion === version && styles.versionActive,
                ]}
              >
                {version}
              </Text>
              {currentVersion === version && (
                <Ionicons name="checkmark" size={24} color="blue" />
              )}
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Version Information">
          <VersionInfo version={currentVersion} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function VersionInfo({ version }: { version: string }) {
  const versionInfo: { [key: string]: string } = {
    KJV: "King James Version - Classic translation, public domain",
    NKJV: "New King James Version - Modern language, formal",
    ESV: "English Standard Version - Literal, scholarly",
    NASB: "New American Standard Bible - Word-for-word accurate",
    NLT: "New Living Translation - Thought-for-thought, easy reading",
    NET: "New English Translation - Study-focused, comprehensive notes",
    WEB: "World English Bible - Modern, simple, easy to read",
  };

  return (
    <Text style={styles.infoText}>
      {versionInfo[version] || "No information available"}
    </Text>
  );
}
```

## Step 5: Update Screens to Pass Version

```typescript
// In ChaptersScreen, ChapterDetailScreen, SearchScreen

async function loadChapter() {
  const { currentVersion } = useBible();
  const chapter = await bibleService.getChapters(
    selectedBook, 
    chapterNum, 
    currentVersion  // Pass version
  );
  setChapter(chapter);
}

async function searchVerses() {
  const { currentVersion } = useBible();
  const results = await bibleService.searchVerses(
    searchQuery, 
    currentVersion  // Pass version
  );
  setSearchResults(results);
}
```

## Step 6: Handle Dynamic Version Loading

For very large installations, consider downloading versions on-demand:

```typescript
// Option: Download versions at runtime

async downloadVersion(version: string): Promise<boolean> {
  try {
    const url = `https://raw.githubusercontent.com/jadenzaleski/bible-translations/master/${version}/${version}_bible.json`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Store in AsyncStorage
    await AsyncStorage.setItem(`bible_${version}`, JSON.stringify(data));
    
    // Cache in memory
    this.bibleVersions[version] = data;
    
    return true;
  } catch (error) {
    console.error(`Failed to download ${version}:`, error);
    return false;
  }
}
```

## Performance Considerations

### File Sizes (Approximate)
- KJV: 4.6 MB
- Each additional version: ~4-5 MB
- Total for 5 versions: ~23 MB (manageable)

### Optimization Options

1. **Bundle Common Versions** (initial app)
   - KJV (public domain, everyone wants it)
   - One more popular version (ESV, NASB, or NLT)
   - Total: ~9-10 MB

2. **Optional Downloads**
   - Users download additional versions on demand
   - Store in AsyncStorage or app cache directory
   - ~20 MB available storage in most cases

3. **Compression**
   - Use gzip compression to reduce by 60-70%
   - KJV: 4.6 MB → ~1.4 MB (compressed)
   - 5 versions: ~23 MB → ~7 MB (compressed)

## Testing Multi-Version Support

```typescript
// Test all versions work
const versions = ["KJV", "NKJV", "ESV"];

for (const version of versions) {
  const chapter = await bibleService.getChapters("Genesis", 1, version);
  console.log(`${version}: ${chapter.verses.length} verses`);
  // Should print: KJV: 31 verses, NKJV: 31 verses, etc.
}

// Test version switching
bibleService.setCurrentVersion("ESV");
const esv = await bibleService.getChapters("John", 3);
console.log(esv.verses[15].text); // Should be ESV translation

bibleService.setCurrentVersion("KJV");
const kjv = await bibleService.getChapters("John", 3);
console.log(kjv.verses[15].text); // Should be KJV translation
```

## Checklist for Adding Versions

- [ ] Download JSON files to `assets/bible/`
- [ ] Update BibleService to load multiple versions
- [ ] Update BibleContext to manage current version
- [ ] Update all screens to pass version to service methods
- [ ] Update SettingsScreen to show version switcher
- [ ] Test switching between versions
- [ ] Test search works with each version
- [ ] Test caching works correctly
- [ ] Test offline functionality
- [ ] Check app bundle size
- [ ] Performance test with multiple versions

## Next: Advanced Features

Once multi-version support is working:

1. **Bookmarks per Version**: Save John 3:16 bookmark in all versions
2. **Compare Versions**: Show same verse in multiple translations
3. **Version Favorites**: Let users favorite their preferred versions
4. **Auto-Download**: Download user's preferred version on first launch
5. **Version Statistics**: Show verse count, last updated date, language

## Resources

- **Repository**: https://github.com/jadenzaleski/bible-translations
- **License Info**: Check individual version folders for license details
- **Translations**: 30+ available, including most popular versions
