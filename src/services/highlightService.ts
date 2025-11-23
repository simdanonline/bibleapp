import AsyncStorage from '@react-native-async-storage/async-storage';
import { Highlight, CreateHighlightRequest, UpdateHighlightRequest, HighlightSearchResult, HighlightColor } from '../types';

const HIGHLIGHTS_KEY = '@bible_app_highlights';
const HIGHLIGHTS_INDEX_KEY = '@bible_app_highlights_index';
const HIGHLIGHTS_COLORS_KEY = '@bible_app_highlights_colors';

class HighlightService {
  private highlightsCache: Highlight[] | null = null;
  private highlightsIndex: Map<string, string> = new Map(); // verseId -> highlightId

  /**
   * Initialize service and load data
   */
  async initialize(): Promise<void> {
    try {
      await this.loadHighlights();
      console.log('Highlights service initialized successfully');
    } catch (error) {
      console.error('Error initializing highlights service:', error);
    }
  }

  /**
   * Load all highlights from storage
   */
  private async loadHighlights(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(HIGHLIGHTS_KEY);
      const indexData = await AsyncStorage.getItem(HIGHLIGHTS_INDEX_KEY);

      this.highlightsCache = data ? JSON.parse(data) : [];

      if (indexData) {
        const indexArray = JSON.parse(indexData);
        this.highlightsIndex = new Map(indexArray);
      }
    } catch (error) {
      console.error('Error loading highlights:', error);
      this.highlightsCache = [];
      this.highlightsIndex = new Map();
    }
  }

  /**
   * Create a new highlight
   */
  async createHighlight(request: CreateHighlightRequest): Promise<Highlight> {
    try {
      const highlights = await this.getHighlights();

      // Check if verse already has a highlight
      const existing = highlights.find((h) => h.verseId === request.verseId);
      if (existing) {
        console.warn(`Highlight already exists for verse ${request.verseId}`);
        throw new Error(`Highlight already exists for verse ${request.verseId}`);
      }

      const highlight: Highlight = {
        id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        verseId: request.verseId,
        book: request.book,
        chapter: request.chapter,
        verse: request.verse,
        text: request.text,
        version: request.version,
        color: request.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      highlights.push(highlight);
      this.highlightsIndex.set(request.verseId, highlight.id);

      await this.saveHighlights(highlights);
      console.log(`Highlight created for verse ${request.verseId} with color ${request.color}`);

      return highlight;
    } catch (error) {
      console.error('Error creating highlight:', error);
      throw error;
    }
  }

  /**
   * Update an existing highlight
   */
  async updateHighlight(highlightId: string, updates: UpdateHighlightRequest): Promise<Highlight> {
    try {
      const highlights = await this.getHighlights();
      const index = highlights.findIndex((h) => h.id === highlightId);

      if (index === -1) {
        throw new Error(`Highlight with ID ${highlightId} not found`);
      }

      const updated: Highlight = {
        ...highlights[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      highlights[index] = updated;
      await this.saveHighlights(highlights);

      console.log(`Highlight ${highlightId} updated`);
      return updated;
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: string): Promise<void> {
    try {
      const highlights = await this.getHighlights();
      const highlight = highlights.find((h) => h.id === highlightId);

      if (!highlight) {
        throw new Error(`Highlight with ID ${highlightId} not found`);
      }

      const filtered = highlights.filter((h) => h.id !== highlightId);
      this.highlightsIndex.delete(highlight.verseId);

      await this.saveHighlights(filtered);
      console.log(`Highlight ${highlightId} deleted`);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  }

  /**
   * Get highlight for a specific verse (O(1) lookup)
   */
  async getHighlightForVerse(verseId: string): Promise<Highlight | null> {
    try {
      const highlightId = this.highlightsIndex.get(verseId);
      if (!highlightId) return null;

      const highlights = await this.getHighlights();
      return highlights.find((h) => h.id === highlightId) || null;
    } catch (error) {
      console.error('Error getting highlight for verse:', error);
      return null;
    }
  }

  /**
   * Check if verse has a highlight
   */
  async hasHighlightForVerse(verseId: string): Promise<boolean> {
    try {
      const highlight = await this.getHighlightForVerse(verseId);
      return highlight !== null;
    } catch (error) {
      console.error('Error checking highlight:', error);
      return false;
    }
  }

  /**
   * Get all highlights with optional filtering
   */
  async getHighlights(page: number = 1, pageSize: number = 50, colorFilter?: HighlightColor): Promise<Highlight[]> {
    try {
      let highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());

      // Filter by color if specified
      if (colorFilter) {
        highlights = highlights.filter((h) => h.color === colorFilter);
      }

      // Sort by creation date (newest first)
      highlights = highlights.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return highlights.slice(start, end);
    } catch (error) {
      console.error('Error getting highlights:', error);
      return [];
    }
  }

  /**
   * Get highlights by color
   */
  async getHighlightsByColor(color: HighlightColor): Promise<Highlight[]> {
    return this.getHighlights(1, 10000, color);
  }

  /**
   * Search highlights by text
   */
  async searchHighlights(query: string, colorFilter?: HighlightColor): Promise<HighlightSearchResult> {
    try {
      const lowerQuery = query.toLowerCase();
      let highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());

      // Filter by search query
      highlights = highlights.filter(
        (h) =>
          h.text.toLowerCase().includes(lowerQuery) ||
          h.book.toLowerCase().includes(lowerQuery)
      );

      // Filter by color if specified
      if (colorFilter) {
        highlights = highlights.filter((h) => h.color === colorFilter);
      }

      return {
        highlights,
        query,
        totalCount: highlights.length,
        searchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error searching highlights:', error);
      return {
        highlights: [],
        query,
        totalCount: 0,
        searchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all unique colors used in highlights
   */
  async getAllColors(): Promise<HighlightColor[]> {
    try {
      const highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());
      const colors = new Set(highlights.map((h) => h.color));
      return Array.from(colors) as HighlightColor[];
    } catch (error) {
      console.error('Error getting colors:', error);
      return [];
    }
  }

  /**
   * Get count of highlights by color
   */
  async getColorStats(): Promise<Record<HighlightColor, number>> {
    try {
      const highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());
      const stats: Record<HighlightColor, number> = {
        yellow: 0,
        green: 0,
        blue: 0,
        pink: 0,
        purple: 0,
        orange: 0,
      };

      highlights.forEach((h) => {
        stats[h.color]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting color stats:', error);
      return {
        yellow: 0,
        green: 0,
        blue: 0,
        pink: 0,
        purple: 0,
        orange: 0,
      };
    }
  }

  /**
   * Get total highlight count
   */
  async getTotalCount(): Promise<number> {
    try {
      const highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());
      return highlights.length;
    } catch (error) {
      console.error('Error getting total count:', error);
      return 0;
    }
  }

  /**
   * Export all highlights as JSON
   */
  async exportHighlights(): Promise<string> {
    try {
      const highlights = this.highlightsCache || (await this.loadHighlightsFromStorage());
      return JSON.stringify(highlights, null, 2);
    } catch (error) {
      console.error('Error exporting highlights:', error);
      throw error;
    }
  }

  /**
   * Import highlights from JSON
   */
  async importHighlights(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData) as Highlight[];
      
      // Validate data
      if (!Array.isArray(imported)) {
        throw new Error('Invalid highlights format');
      }

      // Rebuild index
      this.highlightsIndex.clear();
      imported.forEach((h) => {
        this.highlightsIndex.set(h.verseId, h.id);
      });

      await this.saveHighlights(imported);
      console.log(`Imported ${imported.length} highlights`);
    } catch (error) {
      console.error('Error importing highlights:', error);
      throw error;
    }
  }

  /**
   * Clear all highlights (use with caution)
   */
  async clearAllHighlights(): Promise<void> {
    try {
      this.highlightsCache = [];
      this.highlightsIndex.clear();
      await AsyncStorage.removeItem(HIGHLIGHTS_KEY);
      await AsyncStorage.removeItem(HIGHLIGHTS_INDEX_KEY);
      await AsyncStorage.removeItem(HIGHLIGHTS_COLORS_KEY);
      console.log('All highlights cleared');
    } catch (error) {
      console.error('Error clearing highlights:', error);
      throw error;
    }
  }

  /**
   * Private: Save highlights to storage
   */
  private async saveHighlights(highlights: Highlight[]): Promise<void> {
    try {
      this.highlightsCache = highlights;
      await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));

      // Save index
      const indexArray = Array.from(this.highlightsIndex.entries());
      await AsyncStorage.setItem(HIGHLIGHTS_INDEX_KEY, JSON.stringify(indexArray));

      console.log(`Saved ${highlights.length} highlights to storage`);
    } catch (error) {
      console.error('Error saving highlights:', error);
      throw error;
    }
  }

  /**
   * Private: Load highlights from storage
   */
  private async loadHighlightsFromStorage(): Promise<Highlight[]> {
    try {
      const data = await AsyncStorage.getItem(HIGHLIGHTS_KEY);
      const highlights = data ? JSON.parse(data) : [];
      this.highlightsCache = highlights;
      return highlights;
    } catch (error) {
      console.error('Error loading highlights from storage:', error);
      return [];
    }
  }
}

export default new HighlightService();
