import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bookmark, Favorite, Note, CreateNoteRequest, UpdateNoteRequest, Highlight, CreateHighlightRequest, UpdateHighlightRequest, HighlightColor, BookProgress, BibleProgress, ReadingProgress, ReadingSession, ResumeCardData, CrossReferenceLink, CrossReferenceFilterOptions, CrossReferenceStats } from '../types';
import storageService from '../services/storageService';
import noteService from '../services/noteService';
import highlightService from '../services/highlightService';
import readingProgressService from '../services/readingProgressService';
import { continueReadingService } from '../services/continueReadingService';
import bibleService from '../services/bibleService';
import crossReferenceService from '../services/crossReferenceService.enhanced';

export interface BibleVersion {
  id: string;
  name: string;
  category: string;
}

// Get versions from BibleService
const AVAILABLE_VERSIONS = bibleService.getAvailableVersions();

export const BIBLE_VERSIONS: BibleVersion[] = AVAILABLE_VERSIONS;

interface BibleContextType {
  bookmarks: Bookmark[];
  favorites: Favorite[];
  notes: Note[];
  highlights: Highlight[];
  currentVersion: string;
  availableVersions: BibleVersion[];
  // Reading Progress Methods
  markChapterAsRead: (book: string, chapter: number) => Promise<ReadingProgress>;
  markChapterAsUnread: (book: string, chapter: number) => Promise<ReadingProgress>;
  isChapterRead: (book: string, chapter: number) => boolean;
  getChapterProgress: (book: string, chapter: number) => ReadingProgress | null;
  getBookProgress: (book: string) => BookProgress;
  getAllBookProgress: () => BookProgress[];
  getBibleProgress: () => Promise<BibleProgress>;
  // Continue Reading Methods
  saveReadingPosition: (book: string, chapter: number, scrollPosition: number, scrollPercentage: number, totalScrollHeight: number) => Promise<ReadingSession>;
  getLastReadingSession: () => Promise<ReadingSession | null>;
  getResumeCardData: () => Promise<ResumeCardData | null>;
  clearReadingHistory: () => Promise<void>;
  // Cross-Reference Methods
  getVerseReferences: (book: string, chapter: number, verse: number) => Promise<CrossReferenceLink[]>;
  getChapterReferences: (book: string, chapter: number) => Promise<Map<number, CrossReferenceLink[]>>;
  getFilteredReferences: (book: string, chapter: number, verse: number, options: CrossReferenceFilterOptions) => Promise<CrossReferenceLink[]>;
  preloadChapter: (book: string, chapter: number) => Promise<void>;
  getCrossRefStats: () => Promise<CrossReferenceStats>;
  clearCrossRefCache: () => Promise<void>;
  isCrossRefReady: () => boolean;
  // Existing Methods
  setCurrentVersion: (versionId: string) => Promise<void>;
  addBookmark: (bookmark: Bookmark) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  addFavorite: (favorite: Favorite) => Promise<void>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  isVerseBookmarked: (verseId: string) => boolean;
  isVerseFavorited: (verseId: string) => boolean;
  addNote: (request: CreateNoteRequest) => Promise<Note>;
  updateNote: (noteId: string, updates: UpdateNoteRequest) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  getNoteForVerse: (verseId: string) => Note | null;
  hasNoteForVerse: (verseId: string) => boolean;
  searchNotes: (query: string) => Promise<Note[]>;
  getAllTags: () => Promise<string[]>;
  addHighlight: (request: CreateHighlightRequest) => Promise<Highlight>;
  updateHighlight: (highlightId: string, updates: UpdateHighlightRequest) => Promise<Highlight>;
  deleteHighlight: (highlightId: string) => Promise<void>;
  getHighlightForVerse: (verseId: string) => Highlight | null;
  hasHighlightForVerse: (verseId: string) => boolean;
  getHighlightsByColor: (color: HighlightColor) => Promise<Highlight[]>;
  searchHighlights: (query: string, colorFilter?: HighlightColor) => Promise<Highlight[]>;
  getAllHighlightColors: () => Promise<HighlightColor[]>;
  getHighlightColorStats: () => Promise<Record<HighlightColor, number>>;
  getTotalHighlightCount: () => Promise<number>;
  loadData: () => Promise<void>;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [currentVersion, setCurrentVersionState] = useState<string>("KJV");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Initialize reading progress service
      await readingProgressService.initialize();
      // Initialize continue reading service
      await continueReadingService.initialize();
      // Initialize cross-reference service (with eager loading so data is ready)
      await crossReferenceService.initialize({ lazyLoad: false, preloadEnabled: true });
      console.log('[BibleContext] Cross-reference service initialized');

      const loadedBookmarks = await storageService.getBookmarks();
      const loadedFavorites = await storageService.getFavorites();
      const loadedNotes = await noteService.getNotes(1, 10000);
      const loadedHighlights = await highlightService.getHighlights(1, 10000);
      const savedVersion = await storageService.getCurrentVersion();
      setBookmarks(loadedBookmarks);
      setFavorites(loadedFavorites);
      setNotes(loadedNotes);
      setHighlights(loadedHighlights);
      if (savedVersion) {
        // Check if saved version is available
        const isAvailable = AVAILABLE_VERSIONS.some((v) => v.id === savedVersion);
        if (isAvailable) {
          setCurrentVersionState(savedVersion);
          bibleService.setCurrentVersion(savedVersion);
        } else {
          setCurrentVersionState("KJV");
          bibleService.setCurrentVersion("KJV");
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setCurrentVersion = async (versionId: string) => {
    try {
      const success = bibleService.setCurrentVersion(versionId);
      if (success) {
        await storageService.setCurrentVersion(versionId);
        setCurrentVersionState(versionId);
      }
    } catch (error) {
      console.error('Error setting version:', error);
    }
  };

  const addBookmark = async (bookmark: Bookmark) => {
    try {
      await storageService.addBookmark(bookmark);
      setBookmarks([...bookmarks, bookmark]);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      await storageService.removeBookmark(bookmarkId);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const addFavorite = async (favorite: Favorite) => {
    try {
      await storageService.addFavorite(favorite);
      setFavorites([...favorites, favorite]);
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      await storageService.removeFavorite(favoriteId);
      setFavorites(favorites.filter((f) => f.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const isVerseBookmarked = (verseId: string) => {
    return bookmarks.some((b) => b.verseId === verseId);
  };

  const isVerseFavorited = (verseId: string) => {
    return favorites.some((f) => f.verseId === verseId);
  };

  const addNote = async (request: CreateNoteRequest): Promise<Note> => {
    try {
      const note = await noteService.createNote(request);
      setNotes([...notes, note]);
      return note;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  };

  const updateNote = async (noteId: string, updates: UpdateNoteRequest): Promise<Note> => {
    try {
      const updated = await noteService.updateNote(noteId, updates);
      setNotes(notes.map(n => n.id === noteId ? updated : n));
      return updated;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      await noteService.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const getNoteForVerse = (verseId: string): Note | null => {
    return notes.find(n => n.verseId === verseId) || null;
  };

  const hasNoteForVerse = (verseId: string): boolean => {
    return notes.some(n => n.verseId === verseId);
  };

  const searchNotes = async (query: string): Promise<Note[]> => {
    const result = await noteService.searchNotes(query);
    return result.notes;
  };

  const getAllTags = async (): Promise<string[]> => {
    return noteService.getAllTags();
  };

  const addHighlight = async (request: CreateHighlightRequest): Promise<Highlight> => {
    try {
      const highlight = await highlightService.createHighlight(request);
      setHighlights([...highlights, highlight]);
      return highlight;
    } catch (error) {
      console.error('Error adding highlight:', error);
      throw error;
    }
  };

  const updateHighlight = async (highlightId: string, updates: UpdateHighlightRequest): Promise<Highlight> => {
    try {
      const updated = await highlightService.updateHighlight(highlightId, updates);
      setHighlights(highlights.map(h => h.id === highlightId ? updated : h));
      return updated;
    } catch (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }
  };

  const deleteHighlight = async (highlightId: string): Promise<void> => {
    try {
      await highlightService.deleteHighlight(highlightId);
      setHighlights(highlights.filter(h => h.id !== highlightId));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }
  };

  const getHighlightForVerse = (verseId: string): Highlight | null => {
    return highlights.find(h => h.verseId === verseId) || null;
  };

  const hasHighlightForVerse = (verseId: string): boolean => {
    return highlights.some(h => h.verseId === verseId);
  };

  const getHighlightsByColor = async (color: HighlightColor): Promise<Highlight[]> => {
    return highlightService.getHighlightsByColor(color);
  };

  const searchHighlights = async (query: string, colorFilter?: HighlightColor): Promise<Highlight[]> => {
    const result = await highlightService.searchHighlights(query, colorFilter);
    return result.highlights;
  };

  const getAllHighlightColors = async (): Promise<HighlightColor[]> => {
    return highlightService.getAllColors();
  };

  const getHighlightColorStats = async (): Promise<Record<HighlightColor, number>> => {
    return highlightService.getColorStats();
  };

  const getTotalHighlightCount = async (): Promise<number> => {
    return highlightService.getTotalCount();
  };

  // Reading Progress Methods
  const markChapterAsRead = async (book: string, chapter: number): Promise<ReadingProgress> => {
    return readingProgressService.markChapterAsRead(book, chapter);
  };

  const markChapterAsUnread = async (book: string, chapter: number): Promise<ReadingProgress> => {
    return readingProgressService.markChapterAsUnread(book, chapter);
  };

  const isChapterRead = (book: string, chapter: number): boolean => {
    return readingProgressService.isChapterRead(book, chapter);
  };

  const getChapterProgress = (book: string, chapter: number): ReadingProgress | null => {
    return readingProgressService.getChapterProgress(book, chapter);
  };

  const getBookProgress = (book: string): BookProgress => {
    return readingProgressService.getBookProgress(book);
  };

  const getAllBookProgress = (): BookProgress[] => {
    return readingProgressService.getAllBookProgress();
  };

  const getBibleProgress = async (): Promise<BibleProgress> => {
    return readingProgressService.calculateBibleProgress();
  };

  // Continue Reading Methods
  const saveReadingPosition = async (book: string, chapter: number, scrollPosition: number, scrollPercentage: number, totalScrollHeight: number): Promise<ReadingSession> => {
    return continueReadingService.saveReadingPosition(book, chapter, scrollPosition, scrollPercentage, totalScrollHeight);
  };

  const getLastReadingSession = async (): Promise<ReadingSession | null> => {
    return continueReadingService.getLastReadingSession();
  };

  const getResumeCardData = async (): Promise<ResumeCardData | null> => {
    return continueReadingService.getResumeCardData();
  };

  const clearReadingHistory = async (): Promise<void> => {
    return continueReadingService.clearReadingHistory();
  };

  // Cross-Reference Methods
  const getVerseReferences = async (book: string, chapter: number, verse: number): Promise<CrossReferenceLink[]> => {
    try {
      return await crossReferenceService.getVerseReferences(book, chapter, verse);
    } catch (error) {
      console.error('Error getting verse references:', error);
      return [];
    }
  };

  const getChapterReferences = async (book: string, chapter: number): Promise<Map<number, CrossReferenceLink[]>> => {
    try {
      return await crossReferenceService.getChapterReferences(book, chapter);
    } catch (error) {
      console.error('Error getting chapter references:', error);
      return new Map();
    }
  };

  const getFilteredReferences = async (
    book: string,
    chapter: number,
    verse: number,
    options: CrossReferenceFilterOptions
  ): Promise<CrossReferenceLink[]> => {
    try {
      return await crossReferenceService.getFiltered(book, chapter, verse, options);
    } catch (error) {
      console.error('Error getting filtered references:', error);
      return [];
    }
  };

  const preloadChapter = async (book: string, chapter: number): Promise<void> => {
    try {
      await crossReferenceService.preloadAdjacentChapters(book, chapter);
    } catch (error) {
      console.error('Error preloading chapter:', error);
    }
  };

  const getCrossRefStats = async (): Promise<CrossReferenceStats> => {
    try {
      return await crossReferenceService.getStatistics();
    } catch (error) {
      console.error('Error getting cross-reference stats:', error);
      return {
        totalVersesWithReferences: 0,
        totalReferences: 0,
        averageReferencesPerVerse: 0,
        booksWithMostReferences: [],
      };
    }
  };

  const clearCrossRefCache = async (): Promise<void> => {
    try {
      await crossReferenceService.clearCache();
    } catch (error) {
      console.error('Error clearing cross-reference cache:', error);
    }
  };

  const isCrossRefReady = (): boolean => {
    return crossReferenceService.isReady();
  };

  const value: BibleContextType = {
    bookmarks,
    favorites,
    notes,
    highlights,
    currentVersion,
    availableVersions: AVAILABLE_VERSIONS,
    // Reading Progress
    markChapterAsRead,
    markChapterAsUnread,
    isChapterRead,
    getChapterProgress,
    getBookProgress,
    getAllBookProgress,
    getBibleProgress,
    // Continue Reading
    saveReadingPosition,
    getLastReadingSession,
    getResumeCardData,
    clearReadingHistory,
    // Cross-References
    getVerseReferences,
    getChapterReferences,
    getFilteredReferences,
    preloadChapter,
    getCrossRefStats,
    clearCrossRefCache,
    isCrossRefReady,
    // Existing
    setCurrentVersion,
    addBookmark,
    removeBookmark,
    addFavorite,
    removeFavorite,
    isVerseBookmarked,
    isVerseFavorited,
    addNote,
    updateNote,
    deleteNote,
    getNoteForVerse,
    hasNoteForVerse,
    searchNotes,
    getAllTags,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    getHighlightForVerse,
    hasHighlightForVerse,
    getHighlightsByColor,
    searchHighlights,
    getAllHighlightColors,
    getHighlightColorStats,
    getTotalHighlightCount,
    loadData,
  };

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
};

export const useBible = () => {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
};
