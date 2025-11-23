import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleBook } from '../types';
import { BIBLE_BOOKS } from '../services/bibleService';
import { useThemeColors } from '../utils/theme';
import { useBible } from '../context/BibleContext';
import { ProgressBar } from '../components/ProgressBar';

export const BooksScreen: React.FC = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { getBookProgress, getAllBookProgress } = useBible();
  const [expandedTestament, setExpandedTestament] = useState<'Old' | 'New' | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh progress when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  const bookProgressMap = useMemo(() => {
    const allProgress = getAllBookProgress();
    const map: Record<string, { chaptersRead: number; totalChapters: number; percentageRead: number }> = {};
    allProgress.forEach((bp) => {
      map[bp.book] = {
        chaptersRead: bp.chaptersRead,
        totalChapters: bp.totalChapters,
        percentageRead: bp.percentageRead,
      };
    });
    return map;
  }, [getAllBookProgress, refreshKey]);

  const handleSelectTestament = (testament: 'Old' | 'New') => {
    if (expandedTestament === testament) {
      setExpandedTestament(null);
    } else {
      setExpandedTestament(testament);
    }
  };

  const handleSelectBook = (book: BibleBook) => {
    router.push({
      pathname: '/chapters',
      params: {
        bookId: book.id,
        bookName: book.name,
      },
    });
  };

  const oldTestamentBooks = BIBLE_BOOKS.filter((b) => b.testament === 'Old');
  const newTestamentBooks = BIBLE_BOOKS.filter((b) => b.testament === 'New');

  const testament = [
    { name: 'Old Testament', data: oldTestamentBooks, testament: 'Old' as const },
    { name: 'New Testament', data: newTestamentBooks, testament: 'New' as const },
  ];

  const renderBook = ({ item }: { item: BibleBook }) => {
    const progress = bookProgressMap[item.name];
    const chaptersRead = progress?.chaptersRead || 0;
    const percentageRead = progress?.percentageRead || 0;
    const hasStarted = chaptersRead > 0;
    const isCompleted = chaptersRead === item.chapters && item.chapters > 0;

    return (
      <TouchableOpacity
        style={[styles.bookItem, { backgroundColor: colors.secondaryBackground }]}
        onPress={() => handleSelectBook(item)}
      >
        <View style={styles.bookHeader}>
          <View style={styles.bookInfo}>
            <Text style={[styles.bookName, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.chapterCount, { color: colors.tertiaryText }]}>
              {chaptersRead}/{item.chapters} chapters
            </Text>
          </View>
          {isCompleted && (
            <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
          )}
        </View>
        {hasStarted && (
          <ProgressBar
            progress={percentageRead}
            height={6}
            backgroundColor={colors.border}
            progressColor={isCompleted ? '#10B981' : colors.primary}
            borderRadius={3}
            style={styles.progressStyle}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderTestament = ({ item }: { item: (typeof testament)[0] }) => (
    <View>
      <TouchableOpacity
        style={[styles.testamentHeader, { borderBottomColor: colors.border }]}
        onPress={() => handleSelectTestament(item.testament)}
      >
        <MaterialCommunityIcons
          name={expandedTestament === item.testament ? 'chevron-down' : 'chevron-right'}
          size={24}
          color={colors.primary}
        />
        <Text style={[styles.testamentTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.bookCount, { color: colors.tertiaryText }]}>{item.data.length} books</Text>
      </TouchableOpacity>

      {expandedTestament === item.testament && (
        <FlatList
          data={item.data}
          renderItem={renderBook}
          keyExtractor={(book) => book.id.toString()}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Bible Books</Text>
        </View>
        <FlatList
          data={testament}
          renderItem={renderTestament}
          keyExtractor={(item) => item.testament}
          scrollEnabled
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  testamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginVertical: 8,
    borderBottomWidth: 1,
  },
  testamentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  bookCount: {
    fontSize: 12,
  },
  bookItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 6,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  chapterCount: {
    fontSize: 12,
  },
  progressStyle: {
    marginTop: 4,
  },
});
