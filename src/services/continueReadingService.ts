import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSession, ResumeCardData } from '../types';

const CONTINUE_READING_KEY = '@bible_app_continue_reading';

/**
 * Service for managing reading session tracking with debounced persistence
 * Tracks the last opened chapter and scroll position for seamless resume experience
 */
class ContinueReadingService {
  private currentSession: ReadingSession | null = null;
  private isDirty = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_DELAY = 1000; // 1 second debounce window

  /**
   * Initialize service by loading last session from AsyncStorage
   */
  async initialize(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CONTINUE_READING_KEY);
      if (data) {
        this.currentSession = JSON.parse(data);
        // Validate data integrity
        if (!this.currentSession?.book || this.currentSession?.chapter < 1) {
          console.warn('Invalid reading session data, clearing');
          await this.clearReadingHistory();
          this.currentSession = null;
        }
      }
    } catch (error) {
      console.error('Error initializing continue reading service:', error);
      this.currentSession = null;
    }
  }

  /**
   * Save or update the current reading position
   * Uses debouncing to prevent excessive AsyncStorage writes during scrolling
   *
   * Debouncing explanation:
   * - Scroll events fire very frequently (60+ per second at 60fps)
   * - Without debouncing: 60+ writes per second
   * - With 1000ms debounce: ~1 write per second
   * - Result: 60x reduction in I/O while maintaining data accuracy
   */
  async saveReadingPosition(
    book: string,
    chapter: number,
    scrollPosition: number,
    scrollPercentage: number,
    totalScrollHeight: number,
  ): Promise<ReadingSession> {
    const session: ReadingSession = {
      id: this.generateSessionId(),
      book,
      chapter,
      scrollPosition: Math.max(0, scrollPosition), // Clamp to >= 0
      scrollPercentage: Math.min(100, Math.max(0, scrollPercentage)), // Clamp 0-100
      lastAccessedAt: new Date().toISOString(),
      totalScrollHeight,
    };

    this.currentSession = session;
    this.isDirty = true;
    this.debouncedSave();

    return session;
  }

  /**
   * Retrieve the last reading session
   */
  async getLastReadingSession(): Promise<ReadingSession | null> {
    return this.currentSession;
  }

  /**
   * Get formatted data for resume card UI display
   */
  async getResumeCardData(): Promise<ResumeCardData | null> {
    if (!this.currentSession) {
      return null;
    }

    return {
      book: this.currentSession.book,
      chapter: this.currentSession.chapter,
      scrollPosition: this.currentSession.scrollPosition,
      scrollPercentage: this.currentSession.scrollPercentage,
      lastAccessedAt: this.currentSession.lastAccessedAt,
      formattedTime: this.calculateTimeAgo(this.currentSession.lastAccessedAt),
    };
  }

  /**
   * Force pending changes to AsyncStorage immediately
   * Called on app background or screen cleanup
   */
  async flushChanges(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    if (this.isDirty && this.currentSession) {
      await this.persistToStorage();
      this.isDirty = false;
    }
  }

  /**
   * Clear all reading history
   */
  async clearReadingHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONTINUE_READING_KEY);
      this.currentSession = null;
      this.isDirty = false;
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
    } catch (error) {
      console.error('Error clearing reading history:', error);
    }
  }

  /**
   * Private: Debounced save implementation
   * Resets the timeout on each call, so the save only happens
   * if there are no new scroll events within the debounce window
   */
  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      if (this.isDirty && this.currentSession) {
        await this.persistToStorage();
        this.isDirty = false;
      }
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Private: Persist current session to AsyncStorage
   */
  private async persistToStorage(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await AsyncStorage.setItem(
        CONTINUE_READING_KEY,
        JSON.stringify(this.currentSession),
      );
    } catch (error) {
      console.error('Error persisting reading session:', error);
    }
  }

  /**
   * Private: Calculate human-readable time ago string
   * Examples: "Just now", "5m ago", "2h ago", "Yesterday", "3d ago"
   */
  private calculateTimeAgo(timestamp: string): string {
    try {
      const now = new Date();
      const then = new Date(timestamp);
      const diffMs = now.getTime() - then.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return then.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Private: Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}`;
  }
}

// Export singleton instance
export const continueReadingService = new ContinueReadingService();
