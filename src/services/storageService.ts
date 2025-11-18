import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark, Favorite } from '../types';

const BOOKMARKS_KEY = '@bible_app_bookmarks';
const FAVORITES_KEY = '@bible_app_favorites';
const VERSION_KEY = '@bible_app_current_version';

class StorageService {
  // Bookmarks
  async addBookmark(bookmark: Bookmark): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      // Check if bookmark already exists by verseId
      const exists = bookmarks.some((b) => b.verseId === bookmark.verseId);
      if (exists) {
        console.warn(`Bookmark for verse ${bookmark.verseId} already exists`);
        return;
      }
      bookmarks.push(bookmark);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      console.log(`Bookmark added for verse ${bookmark.verseId}`);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async getBookmarks(): Promise<Bookmark[]> {
    try {
      const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter((b) => b.id !== bookmarkId);
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  async isVerseBookmarked(verseId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some((b) => b.verseId === verseId);
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  }

  // Favorites
  async addFavorite(favorite: Favorite): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      // Check if favorite already exists by verseId
      const exists = favorites.some((f) => f.verseId === favorite.verseId);
      if (exists) {
        console.warn(`Favorite for verse ${favorite.verseId} already exists`);
        return;
      }
      favorites.push(favorite);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      console.log(`Favorite added for verse ${favorite.verseId}`);
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async getFavorites(): Promise<Favorite[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async removeFavorite(favoriteId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter((f) => f.id !== favoriteId);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  async isVerseFavorited(verseId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some((f) => f.verseId === verseId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Bible Version
  async getCurrentVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(VERSION_KEY);
    } catch (error) {
      console.error('Error getting current version:', error);
      return null;
    }
  }

  async setCurrentVersion(versionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(VERSION_KEY, versionId);
    } catch (error) {
      console.error('Error setting current version:', error);
      throw error;
    }
  }
}

export default new StorageService();
