import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../components/SearchBar';
import { VerseCard } from '../components/VerseCard';
import bibleService from '../services/bibleService';
import { useBible } from '../context/BibleContext';
import { Verse } from '../types';
import { useThemeColors } from '../utils/theme';

export const SearchScreen: React.FC = () => {
  const { currentVersion } = useBible();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setHasSearched(true);
      const verses = await bibleService.searchVerses(query, currentVersion);
      setResults(verses);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }, [currentVersion]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search verses..."
        />

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>Start typing to search verses</Text>
          </View>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>No results found</Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <FlatList
            data={results}
            renderItem={({ item }) => <VerseCard verse={item} />}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 8,
  },
});
