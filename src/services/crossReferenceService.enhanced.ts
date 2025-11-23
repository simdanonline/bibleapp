/**
 * Enhanced Cross-Reference Service
 * Features:
 * - Lazy loading of cross-reference data
 * - Automatic chapter preloading
 * - Memory-efficient caching with LRU eviction
 * - O(1) verse lookups via indexed structure
 * - Optional preview text caching
 */

import { CrossReferenceData, CrossReferenceLink, CrossReferenceIndex, ChapterReferencesCache, CrossReferenceStats, PreloadConfig, CrossReferenceFilterOptions, CrossReferenceCategory } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BIBLE_BOOKS } from './bibleService';

const CROSS_REF_INDEX_KEY = '@bible_app_cross_ref_index_v2';
const CROSS_REF_METADATA_KEY = '@bible_app_cross_ref_metadata_v2';
const CROSS_REF_CHAPTER_CACHE_KEY = '@bible_app_cross_ref_chapter_cache_v2';

class CrossReferenceService {
  private crossRefData: CrossReferenceData | null = null;
  private index: CrossReferenceIndex = {};
  private isIndexReady = false;
  private loadingPromise: Promise<void> | null = null;

  // Chapter-level caching
  private chapterCache = new Map<string, ChapterReferencesCache>();
  private cacheSize = 0;
  private maxCacheSize = 20 * 1024 * 1024; // 20MB default
  private cacheExpirationMs = 10 * 60 * 1000; // 10 minutes

  // Preloading
  private preloadConfig: PreloadConfig = {
    enabled: true,
    lookAhead: 2,
    lookBehind: 1,
    maxCacheSize: 20 * 1024 * 1024,
    cacheExpirationMs: 10 * 60 * 1000,
  };
  private preloadInProgress = false;

  /**
   * Initialize the service
   * Options: lazy loading vs eager loading
   */
  async initialize(options?: { lazyLoad?: boolean; preloadEnabled?: boolean; maxCacheSize?: number }): Promise<void> {
    if (this.isIndexReady) return;

    if (options?.lazyLoad !== false) {
      // Lazy load on first use (async)
      this.loadingPromise = this.loadCrossReferencesInternal();
    } else {
      // Eager load (sync)
      await this.loadCrossReferencesInternal();
    }

    if (options?.maxCacheSize) {
      this.maxCacheSize = options.maxCacheSize;
    }

    if (options?.preloadEnabled === false) {
      this.preloadConfig.enabled = false;
    }
  }

  /**
   * Ensure data is loaded before accessing
   */
  async ensureDataLoaded(): Promise<void> {
    if (this.isIndexReady) return;
    if (this.loadingPromise) {
      await this.loadingPromise;
      return;
    }

    this.loadingPromise = this.loadCrossReferencesInternal();
    await this.loadingPromise;
  }

  /**
   * Internal method to load cross-reference data
   */
  private async loadCrossReferencesInternal(): Promise<void> {
    try {
      console.log('[CrossRef] Starting initialization...');
      
      // Try to load from cache first
      const cachedIndex = await AsyncStorage.getItem(CROSS_REF_INDEX_KEY);
      if (cachedIndex) {
        this.index = JSON.parse(cachedIndex);
        this.isIndexReady = true;
        console.log('[CrossRef] Loaded from AsyncStorage cache. Verses with refs:', Object.keys(this.index).length);
        return;
      }

      // Load from JSON file (bundled)
      console.log('[CrossRef] Loading from JSON file...');
      const data = require('../data/crossReferences.json') as CrossReferenceData;
      this.crossRefData = data;

      // Build optimized index for O(1) lookups
      console.log('[CrossRef] Building index...');
      this.buildIndex(data);
      console.log('[CrossRef] Index built. Verses with refs:', Object.keys(this.index).length);

      // Cache the index for future sessions
      await this.cacheIndex();

      this.isIndexReady = true;
      console.log('[CrossRef] Initialization complete. Sample verses:', Object.keys(this.index).slice(0, 5));
    } catch (error) {
      console.error('[CrossRef] Error loading cross-references:', error);
      this.isIndexReady = true; // Prevent retry loops
    }
  }

  /**
   * Build optimized index from raw data
   * Converts from nested book/chapter/verse structure to flat verse ID lookups
   */
  private buildIndex(data: CrossReferenceData): void {
    const index: CrossReferenceIndex = {};

    Object.entries(data.data).forEach(([book, chapters]) => {
      Object.entries(chapters).forEach(([chapter, verses]) => {
        Object.entries(verses).forEach(([verse, links]) => {
          const verseId = `${book}.${chapter}.${verse}`;
          index[verseId] = links;
        });
      });
    });

    this.index = index;
  }

  /**
   * Cache the index to AsyncStorage for persistence
   */
  private async cacheIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem(CROSS_REF_INDEX_KEY, JSON.stringify(this.index));

      if (this.crossRefData) {
        await AsyncStorage.setItem(
          CROSS_REF_METADATA_KEY,
          JSON.stringify({
            version: this.crossRefData.version,
            lastUpdated: this.crossRefData.lastUpdated,
            totalReferences: this.crossRefData.totalReferences,
            indexedVerses: Object.keys(this.index).length,
          })
        );
      }
    } catch (error) {
      console.warn('[CrossRef] Failed to cache index:', error);
    }
  }

  /**
   * Get cross-references for a specific verse (instant lookup)
   */
  async getVerseReferences(book: string, chapter: number, verse: number): Promise<CrossReferenceLink[]> {
    await this.ensureDataLoaded();
    const verseId = `${book}.${chapter}.${verse}`;
    const result = this.index[verseId] || [];
    
    if (result.length === 0) {
      console.debug(`[CrossRef] No references found for ${verseId}. Available keys: ${Object.keys(this.index).slice(0, 5).join(', ')}...`);
    } else {
      console.debug(`[CrossRef] Found ${result.length} references for ${verseId}`);
    }
    
    return result;
  }

  /**
   * Get cross-references for a verse by verse ID
   */
  async getReferencesByVerseId(verseId: string): Promise<CrossReferenceLink[]> {
    await this.ensureDataLoaded();
    return this.index[verseId] || [];
  }

  /**
   * Get all references for a chapter (batch load)
   * Returns a Map for easy verse lookup
   */
  async getChapterReferences(book: string, chapter: number): Promise<Map<number, CrossReferenceLink[]>> {
    await this.ensureDataLoaded();

    const cacheKey = `${book}.${chapter}`;

    // Check memory cache first
    const cached = this.chapterCache.get(cacheKey);
    if (cached && Date.now() - cached.loadedAt < this.cacheExpirationMs) {
      console.log(`[CrossRef] Cache hit for ${cacheKey}`);
      return cached.references;
    }

    // Load from index
    const chapterRefs = new Map<number, CrossReferenceLink[]>();
    const prefix = `${book}.${chapter}.`;

    Object.entries(this.index).forEach(([verseId, refs]) => {
      if (verseId.startsWith(prefix)) {
        const verseNum = parseInt(verseId.split('.')[2], 10);
        chapterRefs.set(verseNum, refs);
      }
    });

    // Calculate cache entry size (rough estimate)
    const estimatedSize = JSON.stringify(Array.from(chapterRefs.values())).length;

    // Add to cache
    const cacheEntry: ChapterReferencesCache = {
      book,
      chapter,
      references: chapterRefs,
      loadedAt: Date.now(),
      size: estimatedSize,
    };

    this.chapterCache.set(cacheKey, cacheEntry);
    this.cacheSize += estimatedSize;

    // Cleanup if needed
    if (this.cacheSize > this.maxCacheSize) {
      this.evictOldestEntries(Math.ceil(this.maxCacheSize * 0.3)); // Free 30%
    }

    // Preload adjacent chapters in background
    if (this.preloadConfig.enabled) {
      this.preloadAdjacentChapters(book, chapter).catch((err) =>
        console.warn('[CrossRef] Preload failed:', err)
      );
    }

    return chapterRefs;
  }

  /**
   * Get filtered cross-references
   */
  async getFiltered(
    book: string,
    chapter: number,
    verse: number,
    options: CrossReferenceFilterOptions
  ): Promise<CrossReferenceLink[]> {
    let references = await this.getVerseReferences(book, chapter, verse);

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      references = references.filter((ref) => options.categories!.includes((ref.category || 'other') as CrossReferenceCategory));
    }

    // Limit results
    if (options.maxReferences && references.length > options.maxReferences) {
      references = references.slice(0, options.maxReferences);
    }

    // Sort
    if (options.sortBy === 'category') {
      references = references.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else if (options.sortBy === 'book') {
      references = references.sort((a, b) => a.book.localeCompare(b.book));
    }

    return references;
  }

  /**
   * Preload adjacent chapters in background (non-blocking)
   */
  async preloadAdjacentChapters(book: string, chapter: number): Promise<void> {
    if (this.preloadInProgress) return; // Debounce

    this.preloadInProgress = true;

    try {
      const promises: Promise<void>[] = [];

      // Look back
      for (let i = 1; i <= this.preloadConfig.lookBehind; i++) {
        if (chapter - i >= 1) {
          promises.push(this.preloadChapterInternal(book, chapter - i));
        }
      }

      // Look ahead
      const bookData = BIBLE_BOOKS.find((b) => b.name === book);
      if (bookData) {
        for (let i = 1; i <= this.preloadConfig.lookAhead; i++) {
          if (chapter + i <= bookData.chapters) {
            promises.push(this.preloadChapterInternal(book, chapter + i));
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.warn('[CrossRef] Preload error:', error);
    } finally {
      this.preloadInProgress = false;
    }
  }

  /**
   * Internal method to preload a chapter without error propagation
   */
  private async preloadChapterInternal(book: string, chapter: number): Promise<void> {
    const cacheKey = `${book}.${chapter}`;

    // Skip if already cached
    if (this.chapterCache.has(cacheKey)) {
      return;
    }

    await this.getChapterReferences(book, chapter);
  }

  /**
   * Get statistics about cross-references
   */
  async getStatistics(): Promise<CrossReferenceStats> {
    await this.ensureDataLoaded();

    const versesWithRefs = Object.keys(this.index).length;
    let totalRefs = 0;
    const categoryCounts: Record<string, number> = {};

    Object.values(this.index).forEach((refs) => {
      totalRefs += refs.length;
      refs.forEach((ref) => {
        const cat = ref.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    });

    // Find books with most references
    const bookRefCounts: { [key: string]: number } = {};
    Object.keys(this.index).forEach((verseId) => {
      const book = verseId.split('.')[0];
      const count = this.index[verseId].length;
      bookRefCounts[book] = (bookRefCounts[book] || 0) + count;
    });

    const booksWithMostReferences = Object.entries(bookRefCounts)
      .map(([book, count]) => ({ book, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVersesWithReferences: versesWithRefs,
      totalReferences: totalRefs,
      averageReferencesPerVerse: versesWithRefs > 0 ? Math.round((totalRefs / versesWithRefs) * 100) / 100 : 0,
      booksWithMostReferences,
      categoryCounts: categoryCounts as Record<string, number>,
      cacheStatistics: this.getCacheMetadata(),
    };
  }

  /**
   * Get cache metadata for debugging
   */
  getCacheMetadata() {
    const entries = Array.from(this.chapterCache.values());
    const times = entries.map((e) => e.loadedAt);

    return {
      totalCachedChapters: this.chapterCache.size,
      totalCacheSize: this.cacheSize,
      oldestCacheTime: times.length > 0 ? Math.min(...times) : 0,
      newestCacheTime: times.length > 0 ? Math.max(...times) : 0,
    };
  }

  /**
   * Evict oldest cache entries to free memory
   */
  private evictOldestEntries(targetSize: number): void {
    const entries = Array.from(this.chapterCache.entries())
      .map(([key, value]) => ({ key, value, age: Date.now() - value.loadedAt }))
      .sort((a, b) => b.age - a.age); // Oldest first

    let freedSize = 0;
    for (const { key, value } of entries) {
      if (freedSize >= targetSize) break;
      this.chapterCache.delete(key);
      this.cacheSize -= value.size;
      freedSize += value.size;
      console.log(`[CrossRef] Evicted cache for ${key}`);
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      this.chapterCache.clear();
      this.cacheSize = 0;

      await AsyncStorage.multiRemove([CROSS_REF_INDEX_KEY, CROSS_REF_METADATA_KEY, CROSS_REF_CHAPTER_CACHE_KEY]);

      console.log('[CrossRef] Cache cleared');
    } catch (error) {
      console.error('[CrossRef] Error clearing cache:', error);
    }
  }

  /**
   * Check if data is ready
   */
  isReady(): boolean {
    return this.isIndexReady;
  }

  /**
   * Get raw data for debugging
   */
  getDebugInfo() {
    return {
      isReady: this.isIndexReady,
      indexSize: Object.keys(this.index).length,
      cacheMetadata: this.getCacheMetadata(),
      preloadConfig: this.preloadConfig,
    };
  }
}

// Export singleton instance
const crossReferenceService = new CrossReferenceService();

export default crossReferenceService;
