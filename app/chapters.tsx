import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChaptersScreen } from '@/src/screens/ChaptersScreen';

export default function ChaptersPage() {
  const params = useLocalSearchParams();
  
  return <ChaptersScreen bookId={Number(params.bookId)} bookName={String(params.bookName)} />;
}
