import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bookmark, Favorite, Note, CreateNoteRequest, UpdateNoteRequest } from '../types';
import storageService from '../services/storageService';
import noteService from '../services/noteService';
import bibleService from '../services/bibleService';

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
  currentVersion: string;
  availableVersions: BibleVersion[];
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
  loadData: () => Promise<void>;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentVersion, setCurrentVersionState] = useState<string>("KJV");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedBookmarks = await storageService.getBookmarks();
      const loadedFavorites = await storageService.getFavorites();
      const loadedNotes = await noteService.getNotes(1, 10000);
      const savedVersion = await storageService.getCurrentVersion();
      setBookmarks(loadedBookmarks);
      setFavorites(loadedFavorites);
      setNotes(loadedNotes);
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

  const value: BibleContextType = {
    bookmarks,
    favorites,
    notes,
    currentVersion,
    availableVersions: AVAILABLE_VERSIONS,
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
