# Verse Notes Implementation Plan

**Status**: 📋 Design Document  
**Created**: November 18, 2025  
**Version**: 1.0.0  
**Last Updated**: November 18, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [AsyncStorage Structure](#asyncstorage-structure)
4. [Linking Architecture](#linking-architecture)
5. [Service Layer Implementation](#service-layer-implementation)
6. [Context Integration](#context-integration)
7. [UI/UX Flow](#uiux-flow)
8. [Component Structure](#component-structure)
9. [Styling Guidelines](#styling-guidelines)
10. [Performance Considerations](#performance-considerations)
11. [Implementation Checklist](#implementation-checklist)
12. [File Structure](#file-structure)

---

## Overview

**Feature**: Verse Notes  
**Purpose**: Allow users to attach personal notes to specific Bible verses, enabling study, reflection, and tracking of theological insights.

**Key Requirements**:
- ✅ One-to-one relationship: One note per verse per user
- ✅ 100% offline-first operation
- ✅ Persistent across app restarts
- ✅ Dark mode support
- ✅ Quick add/edit/delete actions
- ✅ Full-text search within notes
- ✅ Performance optimized for 30K+ verses

**Inspiration From**: Existing Bookmarks/Favorites pattern

---

## Data Model

### TypeScript Interfaces

Add to `src/types/index.ts`:

```typescript
/**
 * Verse Note: Allows users to attach personal notes to specific verses
 * Unique constraint: One note per verse (verseId is unique within notes)
 */
export interface Note {
  // Unique Identifiers
  id: string;                      // UUID: e.g., "note_550e8400-e29b-41d4-a716-446655440000"
  verseId: string;                 // From Verse.id: "KJV:Genesis:1:1"
  
  // Verse Reference (denormalized for quick access)
  book: string;                    // "Genesis"
  chapter: number;                 // 1
  verse: number;                   // 1
  
  // Note Content
  text: string;                    // User's note text (max 5000 chars recommended)
  
  // Metadata
  version: string;                 // Bible version: "KJV", "NIV", etc.
  createdAt: string;               // ISO 8601: "2025-11-18T10:30:00Z"
  updatedAt: string;               // ISO 8601: "2025-11-18T14:45:00Z"
  tags?: string[];                 // Optional tags: ["prayer", "study", "reflection"]
  color?: string;                  // Optional highlight color: "#FFD700", "#90EE90", etc.
  isPinned?: boolean;              // Optional: pins important notes to top
}

/**
 * Note Summary: Lightweight version for list displays
 * Excludes full note text to save memory
 */
export interface NoteSummary {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  version: string;
  createdAt: string;
  updatedAt: string;
  textPreview: string;             // First 100 chars of note
  isPinned?: boolean;
}

/**
 * Note Creation Request
 * Sent from UI to service layer
 */
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

/**
 * Note Update Request
 * Only includes fields to update
 */
export interface UpdateNoteRequest {
  text?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
}

/**
 * Note Search Result
 * For full-text search within notes
 */
export interface NoteSearchResult {
  notes: Note[];
  query: string;
  totalCount: number;
  searchedAt: string;
}
```

### Design Rationale

| Field | Reason |
|-------|--------|
| `id` | UUID for uniqueness; prefixed with "note_" for debugging |
| `verseId` | Links to `Verse.id` (book:chapter:verse); enables primary key lookup |
| `book`, `chapter`, `verse` | Denormalized for quick reference without verse lookup |
| `version` | Tracks which translation the note was created for; allows version-specific notes |
| `createdAt`, `updatedAt` | Timestamps for sorting, filtering, audit trails |
| `tags` | Enables categorization (theology, prayer, study, etc.) |
| `color` | Supports visual highlighting in future UI enhancement |
| `isPinned` | Allows important notes to float to top |

---

## AsyncStorage Structure

### Storage Keys

```typescript
// Primary storage key for all notes
const NOTES_KEY = '@bible_app_notes';

// Optional: Index for fast lookups (improves performance for large datasets)
const NOTES_INDEX_KEY = '@bible_app_notes_index';

// Optional: Tags metadata for auto-completion
const NOTES_TAGS_KEY = '@bible_app_notes_tags';
```

### Data Layout

#### Simple Approach (Recommended for <1000 notes)

```json
{
  "@bible_app_notes": [
    {
      "id": "note_550e8400-e29b-41d4-a716-446655440000",
      "verseId": "KJV:Genesis:1:1",
      "book": "Genesis",
      "chapter": 1,
      "verse": 1,
      "text": "Creation of the universe. God's omnipotence displayed from the beginning.",
      "version": "KJV",
      "createdAt": "2025-11-18T10:30:00Z",
      "updatedAt": "2025-11-18T14:45:00Z",
      "tags": ["creation", "theology"],
      "color": "#FFD700",
      "isPinned": true
    },
    {
      "id": "note_660e8400-e29b-41d4-a716-446655440001",
      "verseId": "KJV:John:3:16",
      "book": "John",
      "chapter": 3,
      "verse": 16,
      "text": "The most important verse about salvation and God's love.",
      "version": "KJV",
      "createdAt": "2025-11-17T08:15:00Z",
      "updatedAt": "2025-11-17T08:15:00Z",
      "tags": ["salvation", "love"],
      "color": "#90EE90",
      "isPinned": false
    }
  ],
  "@bible_app_notes_tags": ["creation", "theology", "salvation", "love", "prayer"]
}
```

#### Optimized Approach (Scalable for 1000+ notes)

**Index Structure** (stored in `@bible_app_notes_index`):

```json
{
  "KJV:Genesis:1:1": "note_550e8400-e29b-41d4-a716-446655440000",
  "KJV:John:3:16": "note_660e8400-e29b-41d4-a716-446655440001"
}
```

**Benefits**:
- O(1) lookup for "does note exist for this verse?"
- Faster filtering by book/chapter
- Detect duplicate note attempts instantly

### Storage Limits & Strategy

| Scenario | Storage Size | AsyncStorage Limit | Strategy |
|----------|-------------|-------------------|----------|
| 100 notes (avg 200 chars) | ~50 KB | ✅ Safe | Store all in memory |
| 500 notes (avg 300 chars) | ~300 KB | ✅ Safe | Cache + Index |
| 1000 notes (avg 300 chars) | ~600 KB | ✅ Safe | Pagination recommended |
| 5000 notes (avg 300 chars) | ~3 MB | ✅ Safe | Full implementation needed |
| 10000+ notes | 6+ MB | ⚠️ Caution | Consider SQLite (future) |

**Recommendation**: Start with simple flat array. Scale to indexed approach when reaching 500+ notes.

---

## Linking Architecture

### Relationship Model

```
Bible Verse (1)
    ↓ (links via verseId)
    ↓
Note (0..1) ← One note per verse maximum
    ↓
    └─ Text content
    └─ Tags
    └─ Color
    └─ Timestamps
```

### Verse ID Convention

All verse linking uses the standard `Verse.id` format:

```typescript
// Format: "{version}:{book}:{chapter}:{verse}"
// Examples:
"KJV:Genesis:1:1"
"NIV:John:3:16"
"ESV:Romans:12:2"

// In code:
const verseId = `${version}:${book}:${chapter}:${verse}`;
```

### Linking Queries

#### Query 1: Get Note for a Specific Verse

```typescript
async getNoteForVerse(verseId: string): Promise<Note | null> {
  const notes = await this.getNotes();
  return notes.find(n => n.verseId === verseId) || null;
}
```

**Time**: O(n) linear scan  
**Optimization**: Use index for O(1) lookup

#### Query 2: Get All Notes for a Book

```typescript
async getNotesForBook(book: string): Promise<Note[]> {
  const notes = await this.getNotes();
  return notes.filter(n => n.book === book);
}
```

**Time**: O(n)  
**Optimization**: Create `@bible_app_notes_by_book` index

#### Query 3: Get All Notes for a Chapter

```typescript
async getNotesForChapter(book: string, chapter: number): Promise<Note[]> {
  const notes = await this.getNotes();
  return notes.filter(n => n.book === book && n.chapter === chapter);
}
```

**Time**: O(n)

#### Query 4: Full-Text Search within Notes

```typescript
async searchNotes(query: string, caseSensitive = false): Promise<NoteSearchResult> {
  const notes = await this.getNotes();
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
    searchedAt: new Date().toISOString()
  };
}
```

**Time**: O(n) - acceptable for <5000 notes

#### Query 5: Check if Verse Has Note

```typescript
async hasNoteForVerse(verseId: string): Promise<boolean> {
  const index = await this.getNoteIndex();
  return verseId in index;
}
```

**Time**: O(1) with index

---

## Service Layer Implementation

### `src/services/noteService.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import {
  Note,
  NoteSummary,
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteSearchResult,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      id: `note_${uuidv4()}`,
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
    const notes = await this.getNotes();
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
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== noteId);

    this.notesCache = filtered;
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));

    // Update index
    await this.updateIndex();
    await this.updateTagsMetadata();
  }

  /**
   * Get note for a specific verse
   * O(1) with index, O(n) without
   */
  async getNoteForVerse(verseId: string): Promise<Note | null> {
    const notes = await this.getNotes();
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
      const sorted = [...this.notesCache].sort((a, b) => {
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
      const notes = await this.getNotes();
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
      const notes = await this.getNotes();
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
        return { notes: [], query, totalCount: 0, searchedAt: new Date().toISOString() };
      }

      const notes = await this.getNotes();
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
      return { notes: [], query, totalCount: 0, searchedAt: new Date().toISOString() };
    }
  }

  /**
   * Get note summaries for efficient list rendering
   */
  async getNoteSummaries(page = 1, pageSize = 50): Promise<NoteSummary[]> {
    const notes = await this.getNotes(page, pageSize);
    return notes.map(n => ({
      id: n.id,
      verseId: n.verseId,
      book: n.book,
      chapter: n.chapter,
      verse: n.verse,
      version: n.version,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      textPreview: n.text.substring(0, 100) + (n.text.length > 100 ? '...' : ''),
      isPinned: n.isPinned,
    }));
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
    const notes = await this.getNotes();
    return notes.length;
  }

  /**
   * Export all notes as JSON (for backup)
   */
  async exportNotes(): Promise<string> {
    const notes = await this.getNotes();
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
      const notes = await this.getNotes();
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
      return this.indexCache;
    } catch (error) {
      console.error('Error getting note index:', error);
      return {};
    }
  }

  private async updateIndex(): Promise<void> {
    try {
      const notes = await this.getNotes();
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
      const notes = await this.getNotes();
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
```

---

## Context Integration

### Update `src/context/BibleContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bookmark, Favorite, Note, CreateNoteRequest, UpdateNoteRequest } from '../types';
import storageService from '../services/storageService';
import noteService from '../services/noteService';
import bibleService from '../services/bibleService';

interface BibleContextType {
  // ... existing properties ...
  
  // Notes
  notes: Note[];
  addNote: (request: CreateNoteRequest) => Promise<Note>;
  updateNote: (noteId: string, updates: UpdateNoteRequest) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  getNoteForVerse: (verseId: string) => Note | null;
  hasNoteForVerse: (verseId: string) => boolean;
  searchNotes: (query: string) => Promise<Note[]>;
  getAllTags: () => Promise<string[]>;
}

export const BibleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing state ...
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ... existing loads ...
      const loadedNotes = await noteService.getNotes();
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading data:', error);
    }
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
    // ... existing ...
    notes,
    addNote,
    updateNote,
    deleteNote,
    getNoteForVerse,
    hasNoteForVerse,
    searchNotes,
    getAllTags,
  };

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
};

export const useBible = () => {
  const context = useContext(BibleContext);
  if (!context) {
    throw new Error('useBible must be used within BibleProvider');
  }
  return context;
};
```

---

## UI/UX Flow

### User Journey 1: Add Note to a Verse

```
User on Chapter Detail Screen
         ↓
   Sees verse with existing icons (bookmark ❌, favorite ❤️)
         ↓
   Taps new "Note 📝" icon
         ↓
   ┌─── Option 1: Modal Opens ───┐
   │  Quick add (text only)      │
   └─────────────────────────────┘
         ↓
   Taps "More Options" button
         ↓
   ┌─── Modal Expands ───┐
   │ Text field (auto-focused)
   │ Tags field (searchable)
   │ Color picker
   │ Save / Cancel buttons
   └─────────────────────┘
         ↓
   User types note text
         ↓
   User adds tags (optional)
         ↓
   User selects color (optional)
         ↓
   User taps "Save Note"
         ↓
   Note saved, modal closes
         ↓
   Note icon now shows "✓" (has note)
         ↓
   Toast: "Note saved ✓"
```

### User Journey 2: Edit Note

```
User on Chapter Detail Screen
         ↓
   Taps verse with note icon ✓
         ↓
   Modal opens with existing note
         ↓
   User can:
   ├─ Edit text
   ├─ Add/remove tags
   ├─ Change color
   ├─ Pin/unpin note
   └─ Delete note
         ↓
   User taps "Update Note"
         ↓
   Note updated, modal closes
         ↓
   Toast: "Note updated ✓"
```

### User Journey 3: View All Notes

```
User taps "Library" tab
         ↓
   Sees tabs: Bookmarks | Favorites | [NEW] Notes
         ↓
   User taps "Notes" tab
         ↓
   Screen shows:
   ├─ Pinned notes at top
   ├─ Recent notes below
   ├─ Search bar to filter notes
   └─ Total count: "42 notes"
         ↓
   User can:
   ├─ Tap note to expand/edit
   ├─ Swipe to delete
   ├─ Search notes
   └─ Filter by tag
```

### User Journey 4: Search Notes

```
User opens Notes Library tab
         ↓
   Taps search bar
         ↓
   Types search query (e.g., "love")
         ↓
   Results update in real-time
   (FlatList re-renders)
         ↓
   Shows matched notes
   └─ Highlights matching text
```

---

## Component Structure

### New Components

#### 1. `src/components/NoteButton.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';

interface NoteButtonProps {
  hasNote: boolean;
  onPress: () => void;
  size?: number;
}

export const NoteButton: React.FC<NoteButtonProps> = ({ hasNote, onPress, size = 24 }) => {
  const colors = useThemeColors();
  
  return (
    <TouchableOpacity onPress={onPress}>
      <MaterialCommunityIcons
        name={hasNote ? 'note-check' : 'note-outline'}
        size={size}
        color={hasNote ? colors.primary : colors.tertiaryText}
      />
    </TouchableOpacity>
  );
};
```

#### 2. `src/components/NoteInputModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

interface NoteInputModalProps {
  visible: boolean;
  note?: Note; // If provided, edit mode
  onSave: (data: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  verseRef?: {
    book: string;
    chapter: number;
    verse: number;
    version: string;
  };
}

const NOTE_COLORS = ['#FFD700', '#90EE90', '#87CEEB', '#FFB6C1', '#DDA0DD'];

export const NoteInputModal: React.FC<NoteInputModalProps> = ({
  visible,
  note,
  onSave,
  onDelete,
  onCancel,
  verseRef,
}) => {
  const colors = useThemeColors();
  const [text, setText] = useState(note?.text || '');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [selectedColor, setSelectedColor] = useState(note?.color || '#FFD700');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      alert('Note cannot be empty');
      return;
    }

    setLoading(true);
    try {
      if (note) {
        // Edit mode
        await onSave({
          text,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          color: selectedColor,
          isPinned,
        } as UpdateNoteRequest);
      } else {
        // Create mode
        if (!verseRef) throw new Error('Verse reference required for new note');
        await onSave({
          verseId: `${verseRef.version}:${verseRef.book}:${verseRef.chapter}:${verseRef.verse}`,
          book: verseRef.book,
          chapter: verseRef.chapter,
          verse: verseRef.verse,
          text,
          version: verseRef.version,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          color: selectedColor,
        } as CreateNoteRequest);
      }
      setText('');
      setTags('');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    verseRef: {
      fontSize: 12,
      color: colors.tertiaryText,
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      minHeight: 120,
      color: colors.text,
      backgroundColor: colors.secondaryBackground,
      marginBottom: 16,
      textAlignVertical: 'top',
    },
    section: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.tertiaryText,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    tagsInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.secondaryBackground,
    },
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pinButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pinButtonText: {
      marginLeft: 12,
      color: colors.text,
      fontSize: 16,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.secondaryBackground,
    },
    deleteButton: {
      backgroundColor: colors.accent,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    cancelButtonText: {
      color: colors.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modal}
      >
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{note ? 'Edit Note' : 'Add Note'}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {verseRef && (
            <Text style={styles.verseRef}>
              {verseRef.book} {verseRef.chapter}:{verseRef.verse}
            </Text>
          )}

          <TextInput
            style={styles.textInput}
            placeholder="Write your note..."
            placeholderTextColor={colors.tertiaryText}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={5000}
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags (optional)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="prayer, study, theology..."
              placeholderTextColor={colors.tertiaryText}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorPicker}>
              {NOTE_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && { borderColor: colors.text },
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <MaterialCommunityIcons name="check" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {note && (
            <TouchableOpacity style={styles.pinButton} onPress={() => setIsPinned(!isPinned)}>
              <MaterialCommunityIcons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.pinButtonText}>{isPinned ? 'Pinned' : 'Pin this note'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check" size={20} color="white" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>

            {note && onDelete && (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
                <MaterialCommunityIcons name="delete" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
```

#### 3. `src/components/NoteCard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onEdit, onDelete }) => {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: note.color || colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    verse: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    pin: {
      color: colors.accent,
    },
    text: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 12,
      color: colors.tertiaryText,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      padding: 4,
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.verse}>
          {note.book} {note.chapter}:{note.verse}
        </Text>
        {note.isPinned && <MaterialCommunityIcons name="pin" size={16} style={styles.pin} />}
      </View>

      <Text style={styles.text} numberOfLines={2}>
        {note.text}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.button} onPress={onEdit}>
                <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.button} onPress={onDelete}>
                <MaterialCommunityIcons name="delete" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

#### 4. `src/screens/NotesLibraryScreen.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBible } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';
import { SearchBar } from '../components/SearchBar';
import { NoteCard } from '../components/NoteCard';
import { Note } from '../types';

export const NotesLibraryScreen: React.FC = () => {
  const colors = useThemeColors();
  const { notes, deleteNote } = useBible();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    filterNotes(searchQuery);
  }, [notes, searchQuery]);

  const filterNotes = async (query: string) => {
    setLoading(true);
    try {
      if (!query.trim()) {
        // Sort by pinned first, then by updatedAt
        const sorted = [...notes].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setFilteredNotes(sorted);
      } else {
        const results = notes.filter(n => {
          const text = n.text.toLowerCase();
          const tags = (n.tags || []).join(' ').toLowerCase();
          return text.includes(query.toLowerCase()) || tags.includes(query.toLowerCase());
        });
        setFilteredNotes(results);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    stats: {
      fontSize: 14,
      color: colors.tertiaryText,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.tertiaryText,
      textAlign: 'center',
    },
  });

  const renderItem = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={() => {
        // Navigate to note detail or expand
      }}
      onDelete={() => deleteNote(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.stats}>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No notes match "${searchQuery}"`
                : 'No notes yet. Tap a note icon on any verse to get started!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            scrollEnabled={true}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
```

### Update Existing Components

#### Update `src/components/VerseCard.tsx`

Add note button to verse card:

```typescript
// Add to existing verse rendering
<View style={styles.iconsContainer}>
  <BookmarkButton hasBookmark={isBookmarked} onPress={toggleBookmark} />
  <FavoriteButton isFavorited={isFavorited} onPress={toggleFavorite} />
  <NoteButton hasNote={hasNote} onPress={openNoteModal} />
  <ShareButton onPress={handleShare} />
</View>
```

#### Update `src/screens/ChapterDetailScreen.tsx`

Integrate note modal into chapter reading screen

---

## Styling Guidelines

### Color Palette (Dark & Light Mode)

#### Light Mode

```typescript
const lightColors = {
  noteBackground: '#FFFBF0',      // Warm note background
  noteText: '#1e293b',             // Dark text
  noteBorder: '#FFD700',           // Gold highlight
  notePinned: '#ef4444',           // Red for pinned
  tagBackground: '#f0f4f8',        // Light gray
  tagText: '#334155',              // Dark gray text
};
```

#### Dark Mode

```typescript
const darkColors = {
  noteBackground: '#1e293b',       // Dark slate
  noteText: '#f1f5f9',             // Light text
  noteBorder: '#FFD700',           // Gold highlight
  notePinned: '#f87171',           // Light red for pinned
  tagBackground: '#334155',        // Darker gray
  tagText: '#cbd5e1',              // Light gray text
};
```

### Component Styling

#### Note Card Border

```typescript
borderLeftWidth: 4,
borderLeftColor: note.color || colors.primary, // Use note color as visual indicator
```

#### Tag Display

```typescript
<View style={{
  backgroundColor: colors.accent + '20',  // 20% opacity
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 4,
  marginRight: 8,
  marginTop: 4,
}}>
  <Text style={{ color: colors.accent, fontSize: 12 }}>
    {tag}
  </Text>
</View>
```

#### Modal Styling

- Use `borderTopLeftRadius: 20` and `borderTopRightRadius: 20` for iOS-style bottom sheet
- Backdrop: `backgroundColor: 'rgba(0,0,0,0.5)'`
- Content: Use `colors.background` and `colors.secondaryBackground`

---

## Performance Considerations

### Optimization Strategies

#### 1. Lazy Loading

```typescript
// Load notes in pages of 50
async getNotes(page = 1, pageSize = 50): Promise<Note[]>

// Pagination component
<FlatList
  onEndReached={() => loadMore()}
  onEndReachedThreshold={0.1}
/>
```

#### 2. Memoization

```typescript
import { useMemo } from 'react';

// Memoize filtered results
const filteredNotes = useMemo(() => {
  return notes.filter(n => n.book === currentBook);
}, [notes, currentBook]);
```

#### 3. Index-Based Lookups

```typescript
// For verse lookups
const noteIndex: Record<string, string> = {};
notes.forEach(n => {
  noteIndex[n.verseId] = n.id;
});

// O(1) lookup instead of O(n) scan
const hasNote = verseId in noteIndex;
```

#### 4. Full-Text Search Optimization

**Current**: Linear scan with substring matching (O(n))

**Future Options**:
- Implement trie-based prefix search
- Add search indexing for faster lookups
- Debounce search input (500ms)

```typescript
// Debounced search
const debouncedSearch = useCallback(
  debounce((query: string) => {
    handleSearch(query);
  }, 500),
  []
);
```

#### 5. Memory Management

```typescript
// Cache in Context
const [notes, setNotes] = useState<Note[]>([]);

// Clear cache when not in use
useEffect(() => {
  return () => {
    // Clean up if needed
  };
}, []);
```

#### 6. AsyncStorage Optimization

```typescript
// Don't load all notes at once if >1000
if (noteCount > 1000) {
  // Use pagination from start
  await loadNotesPage(1, 50);
} else {
  // Load all for smaller datasets
  const allNotes = await getNotes();
}
```

### Performance Benchmarks (Expected)

| Operation | Time | Notes |
|-----------|------|-------|
| Create note | <50ms | Includes AsyncStorage write |
| Update note | <50ms | Index update included |
| Delete note | <50ms | Cache invalidation included |
| Get note for verse | <1ms | With index, O(1) lookup |
| List notes (50) | <20ms | Includes sorting/filtering |
| Search notes (500 notes) | <100ms | Full-text scan |
| Load all notes | <300ms | For 1000 notes |

### Scalability Limits

| Metric | Limit | Action Required |
|--------|-------|-----------------|
| Notes per app | 10K | Monitor memory usage |
| Note text size | 5K chars | Enforced in UI |
| Tags per note | Unlimited | Practical: <10 |
| Total storage | 10 MB | Switch to SQLite |

---

## Implementation Checklist

### Phase 1: Core (Priority 1)

- [ ] Create `Note` TypeScript interface in `src/types/index.ts`
- [ ] Create `noteService.ts` with CRUD operations
- [ ] Update `BibleContext.tsx` with note state & methods
- [ ] Create `NoteButton.tsx` component
- [ ] Create `NoteInputModal.tsx` component
- [ ] Update `VerseCard.tsx` to include note button
- [ ] Update `ChapterDetailScreen.tsx` to integrate modal
- [ ] Add notes storage key and serialization

### Phase 2: UI/UX (Priority 2)

- [ ] Create `NoteCard.tsx` component
- [ ] Create `NotesLibraryScreen.tsx`
- [ ] Update `LibraryScreen.tsx` to add notes tab
- [ ] Implement note search in modal
- [ ] Add tag support with suggestions
- [ ] Add color picker for note highlighting

### Phase 3: Features (Priority 3)

- [ ] Pin/unpin notes
- [ ] Tag-based filtering
- [ ] Full-text search in notes
- [ ] Export notes as JSON
- [ ] Import notes from JSON
- [ ] Note count statistics

### Phase 4: Optimization (Priority 4)

- [ ] Implement note index for O(1) lookups
- [ ] Add pagination for note lists
- [ ] Lazy load notes in library
- [ ] Cache optimization
- [ ] Performance monitoring

---

## File Structure

```
src/
├── types/
│   └── index.ts (add Note, NoteSummary, etc.)
├── services/
│   └── noteService.ts (NEW)
├── components/
│   ├── NoteButton.tsx (NEW)
│   ├── NoteInputModal.tsx (NEW)
│   ├── NoteCard.tsx (NEW)
│   ├── VerseCard.tsx (UPDATED)
│   └── SearchBar.tsx
├── screens/
│   ├── NotesLibraryScreen.tsx (NEW)
│   ├── ChapterDetailScreen.tsx (UPDATED)
│   └── LibraryScreen.tsx (UPDATED)
├── context/
│   └── BibleContext.tsx (UPDATED)
└── utils/
    └── theme.ts
```

---

## Summary

This implementation plan provides:

✅ **Complete data model** with TypeScript interfaces  
✅ **Offline-first storage** via AsyncStorage  
✅ **Efficient verse-note linking** with verseId as key  
✅ **Full CRUD operations** in service layer  
✅ **Context integration** for global state management  
✅ **Rich UI components** for add/edit/view notes  
✅ **Dark mode support** across all components  
✅ **Performance optimizations** including indexing and pagination  
✅ **Scalability** to handle 10K+ notes  
✅ **Feature extensibility** for future enhancements

**Recommended Start**: Implement Phase 1 (Core) for MVP, then add UI/UX in Phase 2.

---

*Last Updated: November 18, 2025*  
*Next Step: Begin Phase 1 implementation with NoteService*
