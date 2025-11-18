import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VerseCard } from '@/src/components/VerseCard';
import bibleService from '@/src/services/bibleService';
import { useBible } from '@/src/context/BibleContext';
import { Verse } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';

export default function HomeScreen() {
  const { currentVersion } = useBible();
  const colors = useThemeColors();
  const [verseOfDay, setVerseOfDay] = React.useState<Verse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recentVerses, setRecentVerses] = React.useState<Verse[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const verse = await bibleService.getVersesForDay(currentVersion);
      setVerseOfDay(verse);

      const chapter = await bibleService.getChapters(verse.book, verse.chapter, currentVersion);
      setRecentVerses(chapter.verses.slice(0, 3));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVersion]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <FlatList
        contentContainerStyle={styles.container}
        data={[{ id: 'header', type: 'header' }, ...(recentVerses.map((v) => ({ ...v, type: 'verse' })) || [])]}
        renderItem={({ item }: { item: any }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Bible App</Text>
                <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Verse of the Day</Text>
                {verseOfDay && <VerseCard verse={verseOfDay} />}
              </View>
            );
          }
          return <VerseCard verse={item} />;
        }}
        keyExtractor={(item, index) => index.toString()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
});
