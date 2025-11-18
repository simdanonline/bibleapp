export interface BibleBook {
  id: number;
  name: string;
  testament: 'Old' | 'New';
  chapters: number;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version?: string;
}

export interface Bookmark {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  verseId: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface SearchResult {
  verses: Verse[];
  query: string;
}
