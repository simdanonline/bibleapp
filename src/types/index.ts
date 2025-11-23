export interface BibleBook {
  id: number;
  name: string;
  testament: 'Old' | 'New';
  chapters: number;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version?: string;
}

export interface Bookmark {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface SearchResult {
  verses: Verse[];
  query: string;
}

export interface Note {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
}

export interface CreateNoteRequest {
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  tags?: string[];
  color?: string;
}

export interface UpdateNoteRequest {
  text?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
}

export interface NoteSearchResult {
  notes: Note[];
  query: string;
  totalCount: number;
  searchedAt: string;
}

// Highlight Types
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

export interface Highlight {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  color: HighlightColor;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHighlightRequest {
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
  color: HighlightColor;
}

export interface UpdateHighlightRequest {
  color?: HighlightColor;
}

export interface HighlightSearchResult {
  highlights: Highlight[];
  query: string;
  totalCount: number;
  searchedAt: string;
}

export type HighlightFilterType = 'all' | HighlightColor;

// Reading Progress Types
export interface ReadingProgress {
  id: string;
  book: string;
  chapter: number;
  isRead: boolean;
  readAt?: string; // ISO timestamp when marked as read
  markedAt: string; // ISO timestamp of last status change
}

export interface BookProgress {
  book: string;
  totalChapters: number;
  chaptersRead: number;
  percentageRead: number; // 0-100
  lastReadAt?: string;
}

export interface BibleProgress {
  totalBooks: number;
  totalChapters: number;
  chaptersRead: number;
  booksStarted: number; // Books with at least 1 chapter read
  booksCompleted: number; // Books with all chapters read
  percentageComplete: number; // 0-100
  lastUpdatedAt: string;
  readingStats: {
    chaptersReadToday: number;
    chaptersReadThisWeek: number;
    chaptersReadThisMonth: number;
    totalReadingDays: number; // Days on which at least one chapter was read
  };
}

export interface CreateReadingProgressRequest {
  book: string;
  chapter: number;
}

export interface ReadingProgressIndex {
  [bookName: string]: {
    [chapterNum: number]: string; // progress id for O(1) lookup
  };
}

// Continue Reading Types
export interface ReadingSession {
  id: string; // Unique session ID (e.g., "session-{timestamp}")
  book: string; // Book name (e.g., "Genesis")
  chapter: number; // Chapter number (e.g., 1)
  scrollPosition: number; // Absolute scroll Y offset in pixels
  scrollPercentage: number; // Percentage through the chapter (0-100)
  lastAccessedAt: string; // ISO timestamp of last access
  totalScrollHeight: number; // Total content height of the chapter
}

export interface ResumeCardData {
  book: string;
  chapter: number;
  scrollPosition: number;
  scrollPercentage: number;
  lastAccessedAt: string;
  formattedTime: string; // "2 hours ago", "Yesterday", etc.
  preview?: string; // Optional: first verse text preview
}

// ==========================================
// READING PLANS TYPES
// ==========================================

/**
 * A passage within a daily reading
 */
export interface ReadingPassage {
  book: string;
  chapter: number;
  startVerse?: number; // Optional: if omitted, entire chapter
  endVerse?: number; // Optional: if omitted, to end of chapter
  title?: string; // Optional: context for the passage
}

/**
 * Single daily reading in a plan
 */
export interface DailyReading {
  day: number; // 1-indexed day number
  passages: ReadingPassage[]; // Can have multiple passages per day
  theme?: string; // Optional: "Faith", "Love", "Forgiveness", etc.
  reflection?: string; // Optional: guided reflection question
}

/**
 * Metadata about a reading plan (template)
 */
export interface ReadingPlanMetadata {
  id: string; // e.g., "plan-30day-ot", "plan-90day-nt"
  name: string; // e.g., "30 Day Old Testament"
  description: string;
  duration: number; // Total days
  testament?: 'Old' | 'New' | 'Complete';
  difficulty: 'Easy' | 'Moderate' | 'Advanced';
  dailyReadings: DailyReading[]; // Array of exactly 'duration' days
  tags: string[]; // e.g., ["old-testament", "30-days"]
  createdAt?: string;
}

/**
 * User's active reading plan enrollment
 */
export interface ReadingPlanEnrollment {
  id: string; // e.g., "enrollment-{uuid}"
  userId?: string; // Optional: for multi-user support
  planId: string; // Reference to ReadingPlanMetadata.id
  planName: string; // Cached plan name for offline display
  startDate: string; // ISO date (YYYY-MM-DD)
  currentDay: number; // 1-indexed: which day user is on
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  completedDays: number[]; // Array of day numbers completed
  streak: number; // Consecutive days completed
  lastReadingDate: string; // ISO date of last progress update
  notes?: string; // User's personal notes
  createdAt: string;
  updatedAt: string;
}

/**
 * Progress for a single passage
 */
export interface PassageProgress {
  passage: ReadingPassage;
  readingTime?: number; // Seconds spent reading
  bookmarked?: boolean;
  highlighted?: boolean;
  notes?: string; // User's notes on this passage
}

/**
 * Progress for a specific day in a specific plan
 */
export interface DayProgress {
  id: string; // e.g., "progress-{enrollmentId}-{day}"
  enrollmentId: string;
  day: number;
  passages: PassageProgress[];
  isCompleted: boolean;
  completedAt?: string; // ISO timestamp
  notes?: string; // Day-specific notes
  createdAt: string;
  updatedAt: string;
}

/**
 * Quick stats for UI display
 */
export interface ReadingPlanStats {
  planId: string;
  enrollmentId: string;
  daysCompleted: number;
  daysRemaining: number;
  completionPercentage: number;
  currentStreak: number;
  longestStreak: number;
  estimatedCompletionDate: string; // ISO date
  isUpToDate: boolean; // User reading today's passage
  daysLate: number; // How many days behind
  lastReadingDate: string;
}

/**
 * Index for O(1) lookups
 */
export interface ReadingPlanIndex {
  [enrollmentId: string]: {
    planId: string;
    currentDay: number;
    status: 'active' | 'paused' | 'completed' | 'abandoned';
  };
}

/**
 * Reminder notification settings
 */
export interface ReminderSettings {
  enrollmentId: string;
  enabled: boolean;
  time?: string; // HH:MM format, e.g., "08:00"
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[]; // 0=Sunday, 1=Monday, etc.
  notificationTitle?: string;
  notificationBody?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// CROSS-REFERENCES TYPES
// ==========================================

/**
 * A single cross-reference link (e.g., "See also Genesis 1:1")
 */
export interface CrossReferenceLink {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse?: number; // For verse ranges (e.g., 1:1-3)
  category?: string; // "similar", "contrast", "fulfillment", "quoted", etc.
  preview?: string; // Optional: cached preview of the verse text
}

/**
 * Cross-references for a specific verse (e.g., TSK, cross-references, etc.)
 */
export interface VerseReference {
  id: string; // "Book.Chapter.Verse" format (e.g., "Genesis.1.1")
  book: string;
  chapter: number;
  verse: number;
  references: CrossReferenceLink[];
  categories?: {
    similar?: CrossReferenceLink[];
    contrast?: CrossReferenceLink[];
    fulfillment?: CrossReferenceLink[];
    quoted?: CrossReferenceLink[];
    prophecy?: CrossReferenceLink[];
    [key: string]: CrossReferenceLink[] | undefined;
  };
}

/**
 * Chapter-level cross-reference index for fast lookups
 */
export interface ChapterReferences {
  book: string;
  chapter: number;
  references: {
    [verse: number]: CrossReferenceLink[]; // verse number -> array of cross-reference links
  };
}

/**
 * Root cross-reference data structure (organized for JSON file)
 */
export interface CrossReferenceData {
  version: string; // e.g., "TSK"
  description: string; // e.g., "Treasury of Scripture Knowledge"
  lastUpdated: string; // ISO date
  totalReferences: number;
  data: {
    [book: string]: {
      [chapter: string]: {
        [verse: string]: CrossReferenceLink[];
      };
    };
  };
}

/**
 * In-memory index for O(1) verse lookups
 */
export interface CrossReferenceIndex {
  [verseId: string]: CrossReferenceLink[]; // "Genesis.1.1" -> [links...]
}

/**
 * Category of cross-reference relationship
 */
export type CrossReferenceCategory =
  | 'similar'      // Similar concept or event
  | 'parallel'     // Parallel passage
  | 'contrast'     // Contrasting view
  | 'fulfillment'  // Prophetic fulfillment
  | 'quoted'       // Direct quote
  | 'prophecy'     // Prophetic reference
  | 'referenced'   // Referenced by
  | 'related'      // Related topic
  | 'other';       // Uncategorized

/**
 * Compressed JSON format for cross-references
 * Keys are abbreviated to reduce file size
 */
export interface CompressedCrossReferenceLink {
  b: string;              // book
  c: number;              // chapter
  v: number;              // startVerse
  e?: number;             // endVerse
  cat?: CrossReferenceCategory;
  p?: string;             // preview
}

/**
 * Grouped cross-references by category
 */
export interface CategorizedReferences {
  similar?: CrossReferenceLink[];
  parallel?: CrossReferenceLink[];
  contrast?: CrossReferenceLink[];
  fulfillment?: CrossReferenceLink[];
  quoted?: CrossReferenceLink[];
  prophecy?: CrossReferenceLink[];
  referenced?: CrossReferenceLink[];
  related?: CrossReferenceLink[];
  other?: CrossReferenceLink[];
}

/**
 * Chapter-level cache entry
 */
export interface ChapterReferencesCache {
  book: string;
  chapter: number;
  references: Map<number, CrossReferenceLink[]>;
  loadedAt: number;
  size: number;
}

/**
 * Metadata about cached references
 */
export interface CacheMetadata {
  totalCachedChapters: number;
  totalCacheSize: number;
  oldestCacheTime: number;
  newestCacheTime: number;
}

/**
 * Statistics about cross-references
 */
export interface CrossReferenceStats {
  totalVersesWithReferences: number;
  totalReferences: number;
  averageReferencesPerVerse: number;
  booksWithMostReferences: Array<{
    book: string;
    count: number;
  }>;
  categoryCounts?: Partial<Record<CrossReferenceCategory, number>>;
  cacheStatistics?: CacheMetadata;
}

/**
 * Result of filtering/searching cross-references
 */
export interface CrossReferenceQueryResult {
  references: CrossReferenceLink[];
  book: string;
  chapter: number;
  verse: number;
  query: string;
  totalMatches: number;
  executionTime: number;
}

/**
 * Enhanced cross-reference with metadata for UI
 */
export interface CrossReferenceLinkWithMetadata extends CrossReferenceLink {
  id: string;
  sourceVerse: string;
  sourceBook: string;
  sourceChapter: number;
  verseText?: string;
  isResolved?: boolean;
}

/**
 * Request to batch load cross-references
 */
export interface BatchCrossReferenceRequest {
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
  }>;
  includePreviews?: boolean;
  categories?: CrossReferenceCategory[];
}

/**
 * Response from batch loading
 */
export interface BatchCrossReferenceResponse {
  results: Map<string, CrossReferenceLink[]>;
  totalReferences: number;
  executionTime: number;
}

/**
 * Filter options for cross-reference display
 */
export interface CrossReferenceFilterOptions {
  categories?: CrossReferenceCategory[];
  maxReferences?: number;
  includePreview?: boolean;
  sortBy?: 'category' | 'relevance' | 'book';
}

/**
 * Preload configuration for adjacent chapters
 */
export interface PreloadConfig {
  enabled: boolean;
  lookAhead: number;
  lookBehind: number;
  maxCacheSize: number;
  cacheExpirationMs: number;
}

/**
 * Options for initializing the cross-reference service
 */
export interface CrossReferenceServiceOptions {
  lazyLoad?: boolean;
  preloadEnabled?: boolean;
  maxCacheSize?: number;
  cacheExpirationMs?: number;
  includePreviews?: boolean;
}

/**
 * Service interface for cross-reference operations
 */
export interface ICrossReferenceService {
  initialize(): Promise<void>;
  isReady(): boolean;
  getVerseReferences(book: string, chapter: number, verse: number): Promise<CrossReferenceLink[]>;
  getReferencesByVerseId(verseId: string): Promise<CrossReferenceLink[]>;
  getChapterReferences(book: string, chapter: number): Promise<Map<number, CrossReferenceLink[]>>;
  getFiltered(book: string, chapter: number, verse: number, options: CrossReferenceFilterOptions): Promise<CrossReferenceLink[]>;
  getStatistics(): Promise<CrossReferenceStats>;
  preloadAdjacentChapters(book: string, chapter: number): Promise<void>;
  clearCache(): Promise<void>;
  getCacheMetadata(): CacheMetadata;
}

/**
 * Props for the cross-reference indicator component
 */
export interface CrossReferenceIndicatorProps {
  verseId: string;
  references: CrossReferenceLink[];
  onVersePress?: (book: string, chapter: number, verse: number) => void;
  compact?: boolean;
  maxPreview?: number;
  onExpand?: () => void;
  onCollapse?: () => void;
}

/**
 * Props for cross-reference modal
 */
export interface CrossReferenceModalProps {
  visible: boolean;
  references: CrossReferenceLink[];
  sourceVerse: string;
  onClose: () => void;
  onReferencePress: (book: string, chapter: number, verse: number) => void;
  enableCategory?: boolean;
  enableSearch?: boolean;
}

/**
 * Props for cross-reference list item
 */
export interface CrossReferenceListItemProps {
  reference: CrossReferenceLink;
  sourceVerse?: string;
  onPress: (book: string, chapter: number, verse: number) => void;
  showCategory?: boolean;
  showPreview?: boolean;
  isSelected?: boolean;
  compact?: boolean;
}

/**
 * Props for preview panel
 */
export interface CrossReferencePreviewPanelProps {
  reference: CrossReferenceLink;
  verseText?: string;
  onNavigate?: () => void;
  loading?: boolean;
}

/**
 * Cross-reference context value
 */
export interface CrossReferenceContextValue {
  getVerseReferences(book: string, chapter: number, verse: number): Promise<CrossReferenceLink[]>;
  getChapterReferences(book: string, chapter: number): Promise<Map<number, CrossReferenceLink[]>>;
  getFiltered(book: string, chapter: number, verse: number, options: CrossReferenceFilterOptions): Promise<CrossReferenceLink[]>;
  getStatistics(): Promise<CrossReferenceStats>;
  isLoaded: boolean;
  preloadChapter(book: string, chapter: number): Promise<void>;
  clearCache(): Promise<void>;
  getCategoryColor(category?: CrossReferenceCategory): string;
  getCategoryLabel(category?: CrossReferenceCategory): string;
}

/**
 * Book-level reference statistics
 */
export interface BookReferenceStats {
  book: string;
  totalReferences: number;
  totalVersesWithReferences: number;
  chaptersWithReferences: number;
  topCategories: Array<{
    category: CrossReferenceCategory;
    count: number;
  }>;
}

/**
 * Reference mapping for cross-links
 */
export interface ReferenceMapping {
  source: {
    book: string;
    chapter: number;
    verse: number;
  };
  targets: CrossReferenceLink[];
  reverse?: CrossReferenceLink[];
}

/**
 * Debounced search result
 */
export interface SearchCrossReferencesResult {
  query: string;
  results: Array<{
    sourceVerse: string;
    references: CrossReferenceLink[];
  }>;
  totalResults: number;
  executionTime: number;
}
