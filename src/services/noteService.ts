import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteSearchResult,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple UUID-like string generator
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const NOTES_KEY = '@bible_app_notes';
const NOTES_INDEX_KEY = '@bible_app_notes_index';
const NOTES_TAGS_KEY = '@bible_app_notes_tags';

class NoteService {
  private notesCache: Note[] | null = null;
  private indexCache: Record<string, string> | null = null;

  /**
   * Create a new note
   * Enforces one-note-per-verse constraint
   */
  async createNote(request: CreateNoteRequest): Promise<Note> {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Note text cannot be empty');
    }

    // Enforce 5000 character limit
    if (request.text.length > 5000) {
      throw new Error('Note text exceeds 5000 character limit');
    }

    // Check if note already exists for this verse
    const existing = await this.getNoteForVerse(request.verseId);
    if (existing) {
      throw new Error(`Note already exists for verse ${request.verseId}`);
    }

    const now = new Date().toISOString();
    const note: Note = {
      id: `note_${generateId()}`,
      verseId: request.verseId,
      book: request.book,
      chapter: request.chapter,
      verse: request.verse,
      text: request.text.trim(),
      version: request.version,
      createdAt: now,
      updatedAt: now,
      tags: request.tags || [],
      color: request.color,
      isPinned: false,
    };

    // Store note
    await this.addNoteToStorage(note);

    // Update index and tags
    await this.updateIndex();
    await this.updateTagsMetadata();

    return note;
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, updates: UpdateNoteRequest): Promise<Note> {
    const notes = await this.getNotes(1, 10000); // Load all for update
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) {
      throw new Error(`Note with id ${noteId} not found`);
    }

    const note = notes[noteIndex];

    // Apply updates
    if (updates.text !== undefined) {
      if (updates.text.length > 5000) {
        throw new Error('Note text exceeds 5000 character limit');
      }
      note.text = updates.text.trim();
    }

    if (updates.tags !== undefined) {
      note.tags = updates.tags;
    }

    if (updates.color !== undefined) {
      note.color = updates.color;
    }

    if (updates.isPinned !== undefined) {
      note.isPinned = updates.isPinned;
    }

    note.updatedAt = new Date().toISOString();

    // Save to storage
    notes[noteIndex] = note;
    this.notesCache = notes;
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

    // Update tags metadata
    await this.updateTagsMetadata();

    return note;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.getNotes(1, 10000);
    const filtered = notes.filter(n => n.id !== noteId);

    this.notesCache = filtered;
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));

    // Update index
    await this.updateIndex();
    await this.updateTagsMetadata();
  }

  /**
   * Get note for a specific verse
   */
  async getNoteForVerse(verseId: string): Promise<Note | null> {
    const notes = await this.getNotes(1, 10000);
    return notes.find(n => n.verseId === verseId) || null;
  }

  /**
   * Check if verse has a note
   */
  async hasNoteForVerse(verseId: string): Promise<boolean> {
    const index = await this.getNoteIndex();
    return verseId in index;
  }

  /**
   * Get all notes (paginated)
   */
  async getNotes(page = 1, pageSize = 50): Promise<Note[]> {
    try {
      if (!this.notesCache) {
        const data = await AsyncStorage.getItem(NOTES_KEY);
        this.notesCache = data ? JSON.parse(data) : [];
      }

      // Sort by pinned first, then by updatedAt (newest first)
      const notes = this.notesCache || [];
      const sorted = [...notes].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return sorted.slice(start, end);
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  /**
   * Get notes for a specific book
   */
  async getNotesForBook(book: string): Promise<Note[]> {
    try {
      const notes = await this.getNotes(1, 10000);
      return notes.filter(n => n.book === book);
    } catch (error) {
      console.error(`Error getting notes for book ${book}:`, error);
      return [];
    }
  }

  /**
   * Get notes for a specific chapter
   */
  async getNotesForChapter(book: string, chapter: number): Promise<Note[]> {
    try {
      const notes = await this.getNotes(1, 10000);
      return notes.filter(n => n.book === book && n.chapter === chapter);
    } catch (error) {
      console.error(`Error getting notes for chapter ${book}:${chapter}:`, error);
      return [];
    }
  }

  /**
   * Full-text search within notes
   */
  async searchNotes(query: string, caseSensitive = false): Promise<NoteSearchResult> {
    try {
      if (!query || query.trim().length === 0) {
        return {
          notes: [],
          query,
          totalCount: 0,
          searchedAt: new Date().toISOString(),
        };
      }

      const notes = await this.getNotes(1, 10000);
      const searchText = caseSensitive ? query : query.toLowerCase();

      const results = notes.filter(n => {
        const noteText = caseSensitive ? n.text : n.text.toLowerCase();
        const tagsText = (n.tags || []).join(' ').toLowerCase();
        return noteText.includes(searchText) || tagsText.includes(searchText);
      });

      return {
        notes: results,
        query,
        totalCount: results.length,
        searchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error searching notes:', error);
      return {
        notes: [],
        query,
        totalCount: 0,
        searchedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all tags across all notes
   */
  async getAllTags(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(NOTES_TAGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  /**
   * Clear all notes (use with caution!)
   */
  async clearAllNotes(): Promise<void> {
    try {
      this.notesCache = [];
      this.indexCache = null;
      await AsyncStorage.removeItem(NOTES_KEY);
      await AsyncStorage.removeItem(NOTES_INDEX_KEY);
      await AsyncStorage.removeItem(NOTES_TAGS_KEY);
    } catch (error) {
      console.error('Error clearing notes:', error);
      throw error;
    }
  }

  /**
   * Get note count
   */
  async getNoteCount(): Promise<number> {
    const notes = await this.getNotes(1, 10000);
    return notes.length;
  }

  /**
   * Export all notes as JSON (for backup)
   */
  async exportNotes(): Promise<string> {
    const notes = await this.getNotes(1, 10000);
    return JSON.stringify(notes, null, 2);
  }

  /**
   * Import notes from JSON
   */
  async importNotes(jsonData: string): Promise<void> {
    try {
      const notes = JSON.parse(jsonData) as Note[];

      // Validate structure
      if (!Array.isArray(notes)) {
        throw new Error('Invalid import format');
      }

      this.notesCache = notes;
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      await this.updateIndex();
      await this.updateTagsMetadata();
    } catch (error) {
      console.error('Error importing notes:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  private async addNoteToStorage(note: Note): Promise<void> {
    try {
      const notes = await this.getNotes(1, 10000);
      notes.push(note);
      this.notesCache = notes;
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error adding note to storage:', error);
      throw error;
    }
  }

  private async getNoteIndex(): Promise<Record<string, string>> {
    try {
      if (!this.indexCache) {
        const data = await AsyncStorage.getItem(NOTES_INDEX_KEY);
        this.indexCache = data ? JSON.parse(data) : {};
      }
      return this.indexCache || {};
    } catch (error) {
      console.error('Error getting note index:', error);
      return {};
    }
  }

  private async updateIndex(): Promise<void> {
    try {
      const notes = await this.getNotes(1, 10000);
      const index: Record<string, string> = {};

      notes.forEach(note => {
        index[note.verseId] = note.id;
      });

      this.indexCache = index;
      await AsyncStorage.setItem(NOTES_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error updating note index:', error);
    }
  }

  private async updateTagsMetadata(): Promise<void> {
    try {
      const notes = await this.getNotes(1, 10000);
      const tagsSet = new Set<string>();

      notes.forEach(note => {
        note.tags?.forEach(tag => tagsSet.add(tag));
      });

      const tags = Array.from(tagsSet).sort();
      await AsyncStorage.setItem(NOTES_TAGS_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Error updating tags metadata:', error);
    }
  }
}

export default new NoteService();
