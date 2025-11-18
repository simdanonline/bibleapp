import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VerseCard } from '../components/VerseCard';
import { NoteCard } from '../components/NoteCard';
import { useBible } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';

type TabType = 'bookmarks' | 'favorites' | 'notes';

export const LibraryScreen: React.FC = () => {
  const { bookmarks, favorites, notes, loadData, deleteNote } = useBible();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      await loadData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = activeTab === 'bookmarks' ? bookmarks : activeTab === 'favorites' ? favorites : notes;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Library</Text>
        </View>

        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookmarks' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <MaterialCommunityIcons name="bookmark" size={20} color={activeTab === 'bookmarks' ? colors.primary : colors.tertiaryText} />
          <Text style={[styles.tabLabel, { color: colors.tertiaryText }, activeTab === 'bookmarks' && { color: colors.primary }]}>
            Bookmarks ({bookmarks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'favorites' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('favorites')}
        >
          <MaterialCommunityIcons name="heart" size={20} color={activeTab === 'favorites' ? colors.accent : colors.tertiaryText} />
          <Text style={[styles.tabLabel, { color: colors.tertiaryText } , activeTab === 'favorites' && { color: colors.accent }]}>
            Favorites ({favorites.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('notes')}
        >
          <MaterialCommunityIcons name="note" size={20} color={activeTab === 'notes' ? colors.primary : colors.tertiaryText} />
          <Text style={[styles.tabLabel, { color: colors.tertiaryText }, activeTab === 'notes' && { color: colors.primary }]}>
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'bookmarks' ? 'bookmark-outline' : activeTab === 'favorites' ? 'heart-outline' : 'note-outline'}
            size={48}
            color={colors.tertiaryText}
          />
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
            No {activeTab === 'bookmarks' ? 'bookmarks' : activeTab === 'favorites' ? 'favorites' : 'notes'} yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={({ item }) => {
            if (activeTab === 'notes') {
              return (
                <NoteCard
                  note={item as any}
                  onPress={() => {}}
                  onDelete={() => deleteNote((item as any).id)}
                />
              );
            }
            return (
              <VerseCard
                verse={{
                  id: (item as any).verseId,
                  book: (item as any).book,
                  chapter: (item as any).chapter,
                  verse: (item as any).verse,
                  text: (item as any).text,
                }}
              />
            );
          }}
          keyExtractor={(item) => (item as any).id}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#6366f1',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 8,
  },
});
