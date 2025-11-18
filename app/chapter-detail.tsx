import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BIBLE_BOOKS } from '@/src/services/bibleService';
import { ChapterDetailScreen } from '@/src/screens/ChapterDetailScreen';

export default function ChapterDetailPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const handleChapterChange = (newChapterNumber: number) => {
    const currentBookName = String(params.bookName);
    const currentBookIndex = BIBLE_BOOKS.findIndex((b) => b.name === currentBookName);
    
    // Handle book transitions
    let finalBookName = currentBookName;
    let finalChapterNumber = newChapterNumber;
    let finalBookId = params.bookId;
    
    // Signal to go to next book (last chapter case)
    if (newChapterNumber === -1) {
      const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
      if (nextBook) {
        finalBookName = nextBook.name;
        finalBookId = nextBook.id;
        finalChapterNumber = 1; // First chapter of next book
      } else {
        return; // Can't go further
      }
    }
    // Signal to go to previous book (first chapter case)
    else if (newChapterNumber === -2) {
      const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
      if (prevBook) {
        finalBookName = prevBook.name;
        finalBookId = prevBook.id;
        finalChapterNumber = prevBook.chapters; // Last chapter of previous book
      } else {
        return; // Can't go further
      }
    }
    
    router.replace({
      pathname: '/chapter-detail',
      params: {
        bookId: finalBookId,
        bookName: finalBookName,
        chapterNumber: finalChapterNumber,
      },
    });
  };
  
  return (
    <ChapterDetailScreen
      bookId={Number(params.bookId)}
      bookName={String(params.bookName)}
      chapterNumber={Number(params.chapterNumber)}
      onChapterChange={handleChapterChange}
    />
  );
}
