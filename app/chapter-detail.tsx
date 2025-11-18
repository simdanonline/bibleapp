import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChapterDetailScreen } from '@/src/screens/ChapterDetailScreen';

export default function ChapterDetailPage() {
  const params = useLocalSearchParams();
  
  return (
    <ChapterDetailScreen
      bookId={Number(params.bookId)}
      bookName={String(params.bookName)}
      chapterNumber={Number(params.chapterNumber)}
    />
  );
}
