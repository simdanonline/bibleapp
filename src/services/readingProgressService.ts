import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingProgress, BookProgress, BibleProgress, ReadingProgressIndex } from '../types';
import { BIBLE_BOOKS } from './bibleService';

const PROGRESS_KEY = '@bible_app_reading_progress';
const PROGRESS_INDEX_KEY = '@bible_app_reading_progress_index';

interface ReadingDayStats {
  date: string; // YYYY-MM-DD format
  chaptersRead: number;
}

class ReadingProgressService {
  private progressCache: ReadingProgress[] = [];
  private progressIndex: ReadingProgressIndex = {};
  private isDirty = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_DELAY = 500; // ms - debounce multiple updates

  /**
   * Initialize service by loading from AsyncStorage
   */
  async initialize(): Promise<void> {
    try {
      await this.loadFromStorage();
    } catch (error) {
      console.error('Error initializing reading progress service:', error);
    }
  }

  /**
   * Load data from AsyncStorage with fallback
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const [progressData, indexData] = await Promise.all([
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(PROGRESS_INDEX_KEY),
      ]);

      if (progressData) {
        this.progressCache = JSON.parse(progressData);
      }

      if (indexData) {
        this.progressIndex = JSON.parse(indexData);
      } else {
        // Rebuild index if missing
        await this.rebuildIndex();
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.progressCache = [];
      this.progressIndex = {};
    }
  }

  /**
   * Rebuild O(1) lookup index from cache
   */
  private async rebuildIndex(): Promise<void> {
    const newIndex: ReadingProgressIndex = {};
    for (const progress of this.progressCache) {
      if (!newIndex[progress.book]) {
        newIndex[progress.book] = {};
      }
      newIndex[progress.book][progress.chapter] = progress.id;
    }
    this.progressIndex = newIndex;
    await AsyncStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(this.progressIndex));
  }

  /**
   * Mark a chapter as read with debouncing
   */
  async markChapterAsRead(book: string, chapter: number): Promise<ReadingProgress> {
    const existing = this.getProgressFromIndex(book, chapter);
    if (existing && existing.isRead) {
      return existing; // Already marked as read
    }

    const now = new Date().toISOString();
    const progress: ReadingProgress = existing || {
      id: `${book}-${chapter}-${Date.now()}`,
      book,
      chapter,
      isRead: true,
      readAt: now,
      markedAt: now,
    };

    if (existing) {
      progress.isRead = true;
      progress.readAt = now;
      progress.markedAt = now;
      this.updateProgressInCache(progress);
    } else {
      this.addProgressToCache(progress);
    }

    this.debouncedSave();
    return progress;
  }

  /**
   * Mark a chapter as unread
   */
  async markChapterAsUnread(book: string, chapter: number): Promise<ReadingProgress> {
    const existing = this.getProgressFromIndex(book, chapter);
    if (!existing || !existing.isRead) {
      return existing || this.createDummyProgress(book, chapter);
    }

    const now = new Date().toISOString();
    existing.isRead = false;
    existing.readAt = undefined;
    existing.markedAt = now;

    this.updateProgressInCache(existing);
    this.debouncedSave();
    return existing;
  }

  /**
   * Get progress for a specific chapter - O(1) lookup
   */
  getChapterProgress(book: string, chapter: number): ReadingProgress | null {
    return this.getProgressFromIndex(book, chapter);
  }

  /**
   * Check if a chapter is read
   */
  isChapterRead(book: string, chapter: number): boolean {
    const progress = this.getProgressFromIndex(book, chapter);
    return progress ? progress.isRead : false;
  }

  /**
   * Get progress for a specific book
   */
  getBookProgress(book: string): BookProgress {
    const bookData = BIBLE_BOOKS.find((b) => b.name === book);
    if (!bookData) {
      return {
        book,
        totalChapters: 0,
        chaptersRead: 0,
        percentageRead: 0,
      };
    }

    const chaptersRead = this.progressCache
      .filter((p) => p.book === book && p.isRead)
      .length;

    const percentageRead = bookData.chapters > 0 ? (chaptersRead / bookData.chapters) * 100 : 0;

    const lastReadProgress = this.progressCache
      .filter((p) => p.book === book && p.isRead)
      .sort((a, b) => new Date(b.readAt || 0).getTime() - new Date(a.readAt || 0).getTime())[0];

    return {
      book,
      totalChapters: bookData.chapters,
      chaptersRead,
      percentageRead: Math.round(percentageRead),
      lastReadAt: lastReadProgress?.readAt,
    };
  }

  /**
   * Get all book progress
   */
  getAllBookProgress(): BookProgress[] {
    return BIBLE_BOOKS.map((book) => this.getBookProgress(book.name));
  }

  /**
   * Calculate total Bible completion statistics
   */
  async calculateBibleProgress(): Promise<BibleProgress> {
    const allBooks = BIBLE_BOOKS;
    const totalChapters = allBooks.reduce((sum, b) => sum + b.chapters, 0);
    const chaptersRead = this.progressCache.filter((p) => p.isRead).length;

    const bookProgressList = this.getAllBookProgress();
    const booksStarted = bookProgressList.filter((bp) => bp.chaptersRead > 0).length;
    const booksCompleted = bookProgressList.filter(
      (bp) => bp.chaptersRead === bp.totalChapters && bp.totalChapters > 0
    ).length;

    const readingStats = await this.calculateReadingStats();

    return {
      totalBooks: allBooks.length,
      totalChapters,
      chaptersRead,
      booksStarted,
      booksCompleted,
      percentageComplete: Math.round((chaptersRead / totalChapters) * 100),
      lastUpdatedAt: new Date().toISOString(),
      readingStats,
    };
  }

  /**
   * Calculate reading statistics by time period
   */
  private async calculateReadingStats(): Promise<BibleProgress['readingStats']> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const chaptersReadToday = this.progressCache.filter((p) => {
      const readDate = p.readAt ? new Date(p.readAt) : null;
      return readDate && readDate >= today;
    }).length;

    const chaptersReadThisWeek = this.progressCache.filter((p) => {
      const readDate = p.readAt ? new Date(p.readAt) : null;
      return readDate && readDate >= weekStart;
    }).length;

    const chaptersReadThisMonth = this.progressCache.filter((p) => {
      const readDate = p.readAt ? new Date(p.readAt) : null;
      return readDate && readDate >= monthStart;
    }).length;

    // Count unique days with reading activity
    const readingDays = new Set<string>();
    this.progressCache.forEach((p) => {
      if (p.readAt) {
        const date = new Date(p.readAt).toISOString().split('T')[0];
        readingDays.add(date);
      }
    });

    return {
      chaptersReadToday,
      chaptersReadThisWeek,
      chaptersReadThisMonth,
      totalReadingDays: readingDays.size,
    };
  }

  /**
   * Get reading stats by date range for charts
   */
  async getReadingStatsByDate(startDate: Date, endDate: Date): Promise<ReadingDayStats[]> {
    const statsByDate: { [key: string]: number } = {};

    this.progressCache.forEach((p) => {
      if (p.readAt) {
        const readDate = new Date(p.readAt);
        if (readDate >= startDate && readDate <= endDate) {
          const dateKey = readDate.toISOString().split('T')[0];
          statsByDate[dateKey] = (statsByDate[dateKey] || 0) + 1;
        }
      }
    });

    return Object.entries(statsByDate)
      .map(([date, chaptersRead]) => ({ date, chaptersRead }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get all reading progress entries (for export/backup)
   */
  getAllProgress(): ReadingProgress[] {
    return [...this.progressCache];
  }

  /**
   * Import reading progress (for restore/migration)
   */
  async importProgress(progressData: ReadingProgress[]): Promise<void> {
    try {
      this.progressCache = progressData;
      await this.rebuildIndex();
      await this.saveToStorage();
    } catch (error) {
      console.error('Error importing progress:', error);
      throw error;
    }
  }

  /**
   * Clear all reading progress
   */
  async clearAllProgress(): Promise<void> {
    try {
      this.progressCache = [];
      this.progressIndex = {};
      await Promise.all([
        AsyncStorage.removeItem(PROGRESS_KEY),
        AsyncStorage.removeItem(PROGRESS_INDEX_KEY),
      ]);
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
    } catch (error) {
      console.error('Error clearing progress:', error);
      throw error;
    }
  }

  // ============ Private Helper Methods ============

  /**
   * Get progress from index - O(1) lookup
   */
  private getProgressFromIndex(book: string, chapter: number): ReadingProgress | null {
    const progressId = this.progressIndex[book]?.[chapter];
    if (!progressId) return null;

    const progress = this.progressCache.find((p) => p.id === progressId);
    return progress || null;
  }

  /**
   * Add progress to cache and update index
   */
  private addProgressToCache(progress: ReadingProgress): void {
    this.progressCache.push(progress);
    if (!this.progressIndex[progress.book]) {
      this.progressIndex[progress.book] = {};
    }
    this.progressIndex[progress.book][progress.chapter] = progress.id;
    this.isDirty = true;
  }

  /**
   * Update progress in cache
   */
  private updateProgressInCache(progress: ReadingProgress): void {
    const index = this.progressCache.findIndex((p) => p.id === progress.id);
    if (index !== -1) {
      this.progressCache[index] = progress;
    }
    this.isDirty = true;
  }

  /**
   * Create dummy progress entry (for chapters not yet tracked)
   */
  private createDummyProgress(book: string, chapter: number): ReadingProgress {
    return {
      id: `${book}-${chapter}-dummy`,
      book,
      chapter,
      isRead: false,
      markedAt: new Date().toISOString(),
    };
  }

  /**
   * Debounced save to avoid excessive AsyncStorage writes
   */
  private debouncedSave(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);

    this.saveTimeout = setTimeout(async () => {
      if (this.isDirty) {
        await this.saveToStorage();
      }
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Save to AsyncStorage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progressCache)),
        AsyncStorage.setItem(PROGRESS_INDEX_KEY, JSON.stringify(this.progressIndex)),
      ]);
      this.isDirty = false;
    } catch (error) {
      console.error('Error saving progress to storage:', error);
      throw error;
    }
  }

  /**
   * Manually trigger save (useful for app lifecycle events)
   */
  async flushChanges(): Promise<void> {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    if (this.isDirty) {
      await this.saveToStorage();
    }
  }
}

export default new ReadingProgressService();
