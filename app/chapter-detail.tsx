import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChapterDetailScreen } from '@/src/screens/ChapterDetailScreen';

export default function ChapterDetailPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const handleChapterChange = (newChapterNumber: number) => {
    router.replace({
      pathname: '/chapter-detail',
      params: {
        bookId: params.bookId,
        bookName: params.bookName,
        chapterNumber: newChapterNumber,
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
