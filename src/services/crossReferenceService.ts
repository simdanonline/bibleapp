import { CrossReferenceData, CrossReferenceLink, CrossReferenceIndex } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CROSS_REF_CACHE_KEY = '@bible_app_cross_ref_cache';
const CROSS_REF_INDEX_KEY = '@bible_app_cross_ref_index';
const CROSS_REF_METADATA_KEY = '@bible_app_cross_ref_metadata';

class CrossReferenceService {
  private crossRefData: CrossReferenceData | null = null;
  private index: CrossReferenceIndex = {};
  private isIndexReady = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Load cross-reference data from JSON file
   * Only loads once and caches in memory
   */
  async ensureDataLoaded(): Promise<void> {
    // Return cached promise if already loading/loaded
    if (this.isIndexReady) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = this.loadCrossReferencesInternal();
    return this.loadingPromise;
  }

  /**
   * Internal method to load cross-reference data
   */
  private async loadCrossReferencesInternal(): Promise<void> {
    try {
      // Try to load from cache first
      const cachedIndex = await AsyncStorage.getItem(CROSS_REF_INDEX_KEY);
      if (cachedIndex) {
        this.index = JSON.parse(cachedIndex);
        this.isIndexReady = true;
        console.log('Cross-references loaded from cache');
        return;
      }

      // Load from JSON file
      const data = require('../data/crossReferences.json') as CrossReferenceData;
      this.crossRefData = data;

      // Build optimized index for O(1) lookups
      this.buildIndex(data);

      // Cache the index for future sessions
      await AsyncStorage.setItem(CROSS_REF_INDEX_KEY, JSON.stringify(this.index));
      await AsyncStorage.setItem(CROSS_REF_METADATA_KEY, JSON.stringify({
        version: data.version,
        lastUpdated: data.lastUpdated,
        totalReferences: data.totalReferences,
      }));

      this.isIndexReady = true;
      console.log('Cross-references indexed and cached');
    } catch (error) {
      console.error('Error loading cross-references:', error);
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
   * Get cross-references for a specific verse
   * Returns empty array if not found
   */
  async getVerseReferences(book: string, chapter: number, verse: number): Promise<CrossReferenceLink[]> {
    await this.ensureDataLoaded();
    const verseId = `${book}.${chapter}.${verse}`;
    return this.index[verseId] || [];
  }

  /**
   * Get cross-references for a verse by verse ID
   */
  async getReferencesByVerseId(verseId: string): Promise<CrossReferenceLink[]> {
    await this.ensureDataLoaded();
    return this.index[verseId] || [];
  }

  /**
   * Get all references for a chapter
   * Useful for preloading
   */
  async getChapterReferences(book: string, chapter: number): Promise<Map<number, CrossReferenceLink[]>> {
    await this.ensureDataLoaded();

    const chapterRefs = new Map<number, CrossReferenceLink[]>();
    const prefix = `${book}.${chapter}.`;

    Object.entries(this.index).forEach(([verseId, refs]) => {
      if (verseId.startsWith(prefix)) {
        const verseNum = parseInt(verseId.split('.')[2], 10);
        chapterRefs.set(verseNum, refs);
      }
    });

    return chapterRefs;
  }

  /**
   * Get statistics about cross-references
   */
  async getStatistics() {
    await this.ensureDataLoaded();

    const versesWithRefs = Object.keys(this.index).length;
    let totalRefs = 0;

    Object.values(this.index).forEach((refs) => {
      totalRefs += refs.length;
    });

    return {
      versesWithReferences: versesWithRefs,
      totalReferences: totalRefs,
      averagePerVerse: versesWithRefs > 0 ? (totalRefs / versesWithRefs).toFixed(2) : 0,
    };
  }

  /**
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CROSS_REF_INDEX_KEY,
        CROSS_REF_METADATA_KEY,
        CROSS_REF_CACHE_KEY,
      ]);
      this.index = {};
      this.isIndexReady = false;
      this.crossRefData = null;
    } catch (error) {
      console.error('Error clearing cross-reference cache:', error);
    }
  }

  /**
   * Get size of cached data (in bytes)
   */
  async getCacheSize(): Promise<number> {
    try {
      const cachedIndex = await AsyncStorage.getItem(CROSS_REF_INDEX_KEY);
      return cachedIndex ? cachedIndex.length : 0;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Lazy load references for a verse on-demand
   * This prevents loading all references upfront
   */
  async lazyLoadVerseReferences(
    book: string,
    chapter: number,
    verse: number,
    onLoad?: (refs: CrossReferenceLink[]) => void
  ): Promise<void> {
    const refs = await this.getVerseReferences(book, chapter, verse);
    if (onLoad) {
      onLoad(refs);
    }
  }

  /**
   * Batch load references for multiple verses
   * More efficient than calling getVerseReferences multiple times
   */
  async batchLoadReferences(
    verses: { book: string; chapter: number; verse: number }[]
  ): Promise<Map<string, CrossReferenceLink[]>> {
    await this.ensureDataLoaded();

    const result = new Map<string, CrossReferenceLink[]>();

    verses.forEach(({ book, chapter, verse }) => {
      const verseId = `${book}.${chapter}.${verse}`;
      result.set(verseId, this.index[verseId] || []);
    });

    return result;
  }

  /**
   * Check if a verse has any cross-references
   */
  async hasReferences(book: string, chapter: number, verse: number): Promise<boolean> {
    await this.ensureDataLoaded();
    const verseId = `${book}.${chapter}.${verse}`;
    return !!this.index[verseId] && this.index[verseId].length > 0;
  }

  /**
   * Get only references of a specific category
   */
  async getReferencessByCategory(
    book: string,
    chapter: number,
    verse: number,
    category: string
  ): Promise<CrossReferenceLink[]> {
    const refs = await this.getVerseReferences(book, chapter, verse);
    return refs.filter((ref) => ref.category === category);
  }

  /**
   * Preload all references for a book
   * Useful for offline access and performance
   */
  async preloadBook(book: string): Promise<void> {
    // This could cache specific books separately if needed
    await this.ensureDataLoaded();
  }

  /**
   * Get a summary of references by category
   */
  async getCategoryBreakdown(book: string, chapter: number, verse: number) {
    const refs = await this.getVerseReferences(book, chapter, verse);

    const breakdown: { [key: string]: number } = {};
    refs.forEach((ref) => {
      const category = ref.category || 'uncategorized';
      breakdown[category] = (breakdown[category] || 0) + 1;
    });

    return breakdown;
  }
}

export default new CrossReferenceService();
