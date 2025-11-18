import { BibleBook, Verse, Chapter } from "../types";
import { loadBibleVersion, AVAILABLE_VERSIONS } from "./BibleVersionLoader";

// Bible Books with chapter counts (from KJV_bible.json)
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { id: 1, name: "Genesis", testament: "Old", chapters: 50 },
  { id: 2, name: "Exodus", testament: "Old", chapters: 40 },
  { id: 3, name: "Leviticus", testament: "Old", chapters: 27 },
  { id: 4, name: "Numbers", testament: "Old", chapters: 36 },
  { id: 5, name: "Deuteronomy", testament: "Old", chapters: 34 },
  { id: 6, name: "Joshua", testament: "Old", chapters: 24 },
  { id: 7, name: "Judges", testament: "Old", chapters: 21 },
  { id: 8, name: "Ruth", testament: "Old", chapters: 4 },
  { id: 9, name: "1 Samuel", testament: "Old", chapters: 31 },
  { id: 10, name: "2 Samuel", testament: "Old", chapters: 24 },
  { id: 11, name: "1 Kings", testament: "Old", chapters: 22 },
  { id: 12, name: "2 Kings", testament: "Old", chapters: 25 },
  { id: 13, name: "1 Chronicles", testament: "Old", chapters: 29 },
  { id: 14, name: "2 Chronicles", testament: "Old", chapters: 36 },
  { id: 15, name: "Ezra", testament: "Old", chapters: 10 },
  { id: 16, name: "Nehemiah", testament: "Old", chapters: 13 },
  { id: 17, name: "Esther", testament: "Old", chapters: 10 },
  { id: 18, name: "Job", testament: "Old", chapters: 42 },
  { id: 19, name: "Psalms", testament: "Old", chapters: 150 },
  { id: 20, name: "Proverbs", testament: "Old", chapters: 31 },
  { id: 21, name: "Ecclesiastes", testament: "Old", chapters: 12 },
  { id: 22, name: "Song of Solomon", testament: "Old", chapters: 8 },
  { id: 23, name: "Isaiah", testament: "Old", chapters: 66 },
  { id: 24, name: "Jeremiah", testament: "Old", chapters: 52 },
  { id: 25, name: "Lamentations", testament: "Old", chapters: 5 },
  { id: 26, name: "Ezekiel", testament: "Old", chapters: 48 },
  { id: 27, name: "Daniel", testament: "Old", chapters: 12 },
  { id: 28, name: "Hosea", testament: "Old", chapters: 14 },
  { id: 29, name: "Joel", testament: "Old", chapters: 3 },
  { id: 30, name: "Amos", testament: "Old", chapters: 9 },
  { id: 31, name: "Obadiah", testament: "Old", chapters: 1 },
  { id: 32, name: "Jonah", testament: "Old", chapters: 4 },
  { id: 33, name: "Micah", testament: "Old", chapters: 7 },
  { id: 34, name: "Nahum", testament: "Old", chapters: 3 },
  { id: 35, name: "Habakkuk", testament: "Old", chapters: 3 },
  { id: 36, name: "Zephaniah", testament: "Old", chapters: 3 },
  { id: 37, name: "Haggai", testament: "Old", chapters: 2 },
  { id: 38, name: "Zechariah", testament: "Old", chapters: 14 },
  { id: 39, name: "Malachi", testament: "Old", chapters: 4 },
  // New Testament
  { id: 40, name: "Matthew", testament: "New", chapters: 28 },
  { id: 41, name: "Mark", testament: "New", chapters: 16 },
  { id: 42, name: "Luke", testament: "New", chapters: 24 },
  { id: 43, name: "John", testament: "New", chapters: 21 },
  { id: 44, name: "Acts", testament: "New", chapters: 28 },
  { id: 45, name: "Romans", testament: "New", chapters: 16 },
  { id: 46, name: "1 Corinthians", testament: "New", chapters: 16 },
  { id: 47, name: "2 Corinthians", testament: "New", chapters: 13 },
  { id: 48, name: "Galatians", testament: "New", chapters: 6 },
  { id: 49, name: "Ephesians", testament: "New", chapters: 6 },
  { id: 50, name: "Philippians", testament: "New", chapters: 4 },
  { id: 51, name: "Colossians", testament: "New", chapters: 4 },
  { id: 52, name: "1 Thessalonians", testament: "New", chapters: 5 },
  { id: 53, name: "2 Thessalonians", testament: "New", chapters: 3 },
  { id: 54, name: "1 Timothy", testament: "New", chapters: 6 },
  { id: 55, name: "2 Timothy", testament: "New", chapters: 4 },
  { id: 56, name: "Titus", testament: "New", chapters: 3 },
  { id: 57, name: "Philemon", testament: "New", chapters: 1 },
  { id: 58, name: "Hebrews", testament: "New", chapters: 13 },
  { id: 59, name: "James", testament: "New", chapters: 5 },
  { id: 60, name: "1 Peter", testament: "New", chapters: 5 },
  { id: 61, name: "2 Peter", testament: "New", chapters: 3 },
  { id: 62, name: "1 John", testament: "New", chapters: 5 },
  { id: 63, name: "2 John", testament: "New", chapters: 1 },
  { id: 64, name: "3 John", testament: "New", chapters: 1 },
  { id: 65, name: "Jude", testament: "New", chapters: 1 },
  { id: 66, name: "Revelation", testament: "New", chapters: 22 },
];

// Map book names to bible-api.com format
const BOOK_NAME_MAPPING: { [key: string]: string } = {
  Genesis: "Genesis",
  Exodus: "Exodus",
  Leviticus: "Leviticus",
  Numbers: "Numbers",
  Deuteronomy: "Deuteronomy",
  Joshua: "Joshua",
  Judges: "Judges",
  Ruth: "Ruth",
  "1 Samuel": "1 Samuel",
  "2 Samuel": "2 Samuel",
  "1 Kings": "1 Kings",
  "2 Kings": "2 Kings",
  "1 Chronicles": "1 Chronicles",
  "2 Chronicles": "2 Chronicles",
  Ezra: "Ezra",
  Nehemiah: "Nehemiah",
  Esther: "Esther",
  Job: "Job",
  Psalms: "Psalms",
  Proverbs: "Proverbs",
  Ecclesiastes: "Ecclesiastes",
  "Song of Solomon": "Song of Solomon",
  Isaiah: "Isaiah",
  Jeremiah: "Jeremiah",
  Lamentations: "Lamentations",
  Ezekiel: "Ezekiel",
  Daniel: "Daniel",
  Hosea: "Hosea",
  Joel: "Joel",
  Amos: "Amos",
  Obadiah: "Obadiah",
  Jonah: "Jonah",
  Micah: "Micah",
  Nahum: "Nahum",
  Habakkuk: "Habakkuk",
  Zephaniah: "Zephaniah",
  Haggai: "Haggai",
  Zechariah: "Zechariah",
  Malachi: "Malachi",
  Matthew: "Matthew",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Romans: "Romans",
  "1 Corinthians": "1 Corinthians",
  "2 Corinthians": "2 Corinthians",
  Galatians: "Galatians",
  Ephesians: "Ephesians",
  Philippians: "Philippians",
  Colossians: "Colossians",
  "1 Thessalonians": "1 Thessalonians",
  "2 Thessalonians": "2 Thessalonians",
  "1 Timothy": "1 Timothy",
  "2 Timothy": "2 Timothy",
  Titus: "Titus",
  Philemon: "Philemon",
  Hebrews: "Hebrews",
  James: "James",
  "1 Peter": "1 Peter",
  "2 Peter": "2 Peter",
  "1 John": "1 John",
  "2 John": "2 John",
  "3 John": "3 John",
  Jude: "Jude",
  Revelation: "Revelation",
};

// Version metadata (sourced from BibleVersionLoader)
const BIBLE_VERSIONS = Object.entries(AVAILABLE_VERSIONS).map(([id, data]) => ({
  id,
  name: data.name,
  category: data.category,
}));

class BibleService {
  private bibleVersions: { [version: string]: { [key: string]: { [key: string]: { [key: string]: string } } } } = {};
  private currentVersion: string = "KJV";
  private loadedVersions: Set<string> = new Set();

  constructor() {
    this.loadKJV();
  }

  private loadKJV(): void {
    try {
      const kjvJSON = loadBibleVersion("KJV");
      this.bibleVersions["KJV"] = kjvJSON;
      this.loadedVersions.add("KJV");
      console.log("KJV loaded successfully from local JSON");
    } catch (error) {
      console.error("Error loading KJV Bible data from JSON:", error);
    }
  }

  private loadVersion(versionId: string): boolean {
    if (this.loadedVersions.has(versionId)) {
      return true;
    }

    try {
      const bibleJSON = loadBibleVersion(versionId);
      this.bibleVersions[versionId] = bibleJSON;
      this.loadedVersions.add(versionId);
      console.log(`${versionId} loaded successfully from local JSON`);
      return true;
    } catch (error) {
      console.warn(`Error loading ${versionId} Bible data: ${error}`);
      return false;
    }
  }

  setCurrentVersion(versionId: string): boolean {
    if (this.loadVersion(versionId)) {
      this.currentVersion = versionId;
      console.log(`Bible version changed to: ${versionId}`);
      return true;
    }
    console.warn(`Version ${versionId} not available`);
    return false;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getAvailableVersions() {
    return BIBLE_VERSIONS;
  }

  getLoadedVersions(): string[] {
    return Array.from(this.loadedVersions);
  }

  isVersionAvailable(versionId: string): boolean {
    return this.loadedVersions.has(versionId);
  }

  async getBooks(): Promise<BibleBook[]> {
    try {
      return BIBLE_BOOKS;
    } catch (error) {
      console.error("Error fetching books:", error);
      throw error;
    }
  }

  private getBookAbbreviation(bookName: string): string {
    return BOOK_NAME_MAPPING[bookName] || bookName;
  }

  async getChapters(
    bookName: string,
    chapterNumber: number,
    versionId?: string
  ): Promise<Chapter> {
    try {
      const version = versionId || this.currentVersion;
      
      // Load version if not already loaded
      if (!this.isVersionAvailable(version)) {
        this.loadVersion(version);
      }

      // Get verses from local Bible JSON
      const bibleData = this.bibleVersions[version];
      if (!bibleData) {
        console.warn(`Version ${version} not available`);
        return this.getMockChapter(bookName, chapterNumber);
      }

      const chapterData = bibleData[bookName]?.[String(chapterNumber)];
      
      if (!chapterData) {
        console.warn(`No data found for ${bookName} ${chapterNumber} in ${version}`);
        return this.getMockChapter(bookName, chapterNumber);
      }

      // Convert verse object to array
      const verses: Verse[] = Object.entries(chapterData).map(([verseNum, text]) => ({
        id: `${bookName}.${chapterNumber}.${verseNum}`,
        book: bookName,
        chapter: chapterNumber,
        verse: parseInt(verseNum, 10),
        text: String(text),
        version: version,
      }));

      // Sort by verse number
      verses.sort((a, b) => a.verse - b.verse);

      const chapter: Chapter = {
        book: bookName,
        chapter: chapterNumber,
        verses: verses,
      };

      return chapter;
    } catch (error) {
      console.error("Error fetching chapter:", error);
      // Fallback to mock data
      return this.getMockChapter(bookName, chapterNumber);
    }
  }

  private extractVerseNumber(verseId: string): number {
    // Extract verse number from format like "GEN.50.25" -> 25
    const parts = verseId.split(".");
    return parseInt(parts[parts.length - 1] || "0", 10);
  }

  private getMockChapter(bookName: string, chapterNumber: number): Chapter {
    const mockVerses: Verse[] = [];
    const version = this.currentVersion;
    for (let i = 1; i <= 15; i++) {
      mockVerses.push({
        id: `${bookName}-${chapterNumber}-${i}`,
        book: bookName,
        chapter: chapterNumber,
        verse: i,
        text: `${i}. This is verse ${i} of ${bookName} chapter ${chapterNumber}.`,
        version: version,
      });
    }
    return {
      book: bookName,
      chapter: chapterNumber,
      verses: mockVerses,
    };
  }

  async searchVerses(query: string, versionId?: string): Promise<Verse[]> {
    try {
      if (query.trim().length === 0) {
        return [];
      }

      const version = versionId || this.currentVersion;
      
      // Load version if not already loaded
      if (!this.isVersionAvailable(version)) {
        this.loadVersion(version);
      }

      const lowerQuery = query.toLowerCase();
      const verses: Verse[] = [];
      const bibleData = this.bibleVersions[version];

      if (!bibleData) {
        console.warn(`Version ${version} not available for search`);
        return [];
      }

      // Search through all books and chapters
      for (const [bookName, chapters] of Object.entries(bibleData)) {
        for (const [chapterNum, verseMap] of Object.entries(chapters as Record<string, Record<string, string>>)) {
          for (const [verseNum, text] of Object.entries(verseMap)) {
            if (String(text).toLowerCase().includes(lowerQuery)) {
              verses.push({
                id: `${bookName}.${chapterNum}.${verseNum}`,
                book: bookName,
                chapter: parseInt(chapterNum, 10),
                verse: parseInt(verseNum, 10),
                text: String(text),
                version: version,
              });
              // Limit results to avoid performance issues
              if (verses.length >= 50) break;
            }
          }
          if (verses.length >= 50) break;
        }
        if (verses.length >= 50) break;
      }

      return verses;
    } catch (error) {
      console.error("Error searching verses:", error);
      return [];
    }
  }

  async getVersesForDay(versionId?: string): Promise<Verse> {
    try {
      const version = versionId || this.currentVersion;
      
      // Load version if not already loaded
      if (!this.isVersionAvailable(version)) {
        this.loadVersion(version);
      }

      const bibleData = this.bibleVersions[version];
      if (!bibleData) {
        console.warn(`Version ${version} not available`);
        return this.getDefaultVerse(version);
      }

      // Get a deterministic random verse for today
      // Use date to ensure same verse throughout the day
      const today = new Date();
      const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      const seed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      // Get all books
      const books = Object.keys(bibleData);
      if (books.length === 0) {
        return this.getDefaultVerse(version);
      }

      // Select book using seeded random
      const bookIndex = seed % books.length;
      const book = books[bookIndex];

      // Get all chapters for the book
      const chapters = Object.keys(bibleData[book]);
      if (chapters.length === 0) {
        return this.getDefaultVerse(version);
      }

      // Select chapter using seeded random
      const chapterIndex = (seed * 7) % chapters.length; // Different multiplier for different distribution
      const chapter = parseInt(chapters[chapterIndex]);

      // Get all verses for the chapter
      const verses = Object.keys(bibleData[book][chapter.toString()]);
      if (verses.length === 0) {
        return this.getDefaultVerse(version);
      }

      // Select verse using seeded random
      const verseIndex = (seed * 13) % verses.length; // Different multiplier for different distribution
      const verse = parseInt(verses[verseIndex]);

      const verseText = bibleData[book][chapter.toString()][verse.toString()];

      if (verseText) {
        return {
          id: `verse-of-day`,
          book: book,
          chapter: chapter,
          verse: verse,
          text: String(verseText),
          version: version,
        };
      }

      return this.getDefaultVerse(version);
    } catch (error) {
      console.error("Error fetching verse of day:", error);
      return this.getDefaultVerse(this.currentVersion);
    }
  }

  private getDefaultVerse(version: string): Verse {
    return {
      id: `verse-of-day`,
      book: "John",
      chapter: 3,
      verse: 16,
      text: "16. For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      version: version,
    };
  }

  // No longer needed - all data is offline and loaded on demand
}

export default new BibleService();
