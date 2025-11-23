import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VerseCard } from '../components/VerseCard';
import { NoteCard } from '../components/NoteCard';
import { HighlightCard } from '../components/HighlightCard';
import { HighlightColorPickerModal } from '../components/HighlightColorPickerModal';
import { useBible } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';
import { HighlightColor } from '../types';

type TabType = 'bookmarks' | 'favorites' | 'notes' | 'highlights';

export const LibraryScreen: React.FC = () => {
  const { bookmarks, favorites, notes, highlights, loadData, deleteNote, deleteHighlight, updateHighlight } = useBible();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');
  const [loading, setLoading] = useState(true);
  const [highlightColorModalVisible, setHighlightColorModalVisible] = useState(false);
  const [selectedHighlightForColorChange, setSelectedHighlightForColorChange] = useState<string | null>(null);
  const [highlightColorFilter, setHighlightColorFilter] = useState<HighlightColor | 'all'>('all');

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await loadData();
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = activeTab === 'bookmarks' 
    ? bookmarks 
    : activeTab === 'favorites' 
    ? favorites 
    : activeTab === 'notes' 
    ? notes 
    : highlightColorFilter === 'all'
    ? highlights
    : highlights.filter(h => h.color === highlightColorFilter);

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
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

        <TouchableOpacity
          style={[styles.tab, activeTab === 'highlights' && { borderBottomColor: colors.accent }]}
          onPress={() => setActiveTab('highlights')}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={activeTab === 'highlights' ? colors.accent : colors.tertiaryText} />
          <Text style={[styles.tabLabel, { color: colors.tertiaryText }, activeTab === 'highlights' && { color: colors.accent }]}>
            Highlights ({highlights.length})
          </Text>
        </TouchableOpacity>
        </ScrollView>

      {activeTab === 'highlights' && (
        <View style={styles.colorFilterContainer}>
          <TouchableOpacity
            style={[styles.colorFilterButton, highlightColorFilter === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setHighlightColorFilter('all')}
          >
            <Text style={[styles.colorFilterText, highlightColorFilter === 'all' && { color: colors.background }]}>
              All
            </Text>
          </TouchableOpacity>
          {['yellow', 'green', 'blue', 'pink', 'purple', 'orange'].map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorFilterButton, highlightColorFilter === color && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setHighlightColorFilter(color as HighlightColor)}
            >
              <View
                style={[
                  styles.colorFilterDot,
                  {
                    backgroundColor:
                      color === 'yellow' ? '#FFF59D' :
                      color === 'green' ? '#C8E6C9' :
                      color === 'blue' ? '#BBDEFB' :
                      color === 'pink' ? '#F8BBD0' :
                      color === 'purple' ? '#E1BEE7' :
                      '#FFE0B2',
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={activeTab === 'bookmarks' ? 'bookmark-outline' : activeTab === 'favorites' ? 'heart-outline' : activeTab === 'notes' ? 'note-outline' : 'pencil-outline'}
            size={48}
            color={colors.tertiaryText}
          />
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
            No {activeTab === 'bookmarks' ? 'bookmarks' : activeTab === 'favorites' ? 'favorites' : activeTab === 'notes' ? 'notes' : 'highlights'} yet
          </Text>
        </View>
      ) : (
        <>
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
              if (activeTab === 'highlights') {
                return (
                  <HighlightCard
                    highlight={item as any}
                    onDelete={() => deleteHighlight((item as any).id)}
                    onChangeColor={() => {
                      setSelectedHighlightForColorChange((item as any).id);
                      setHighlightColorModalVisible(true);
                    }}
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
        </>
      )}

      <HighlightColorPickerModal
        visible={highlightColorModalVisible}
        onDismiss={() => {
          setHighlightColorModalVisible(false);
          setSelectedHighlightForColorChange(null);
        }}
        onSelectColor={async (color) => {
          if (selectedHighlightForColorChange) {
            await updateHighlight(selectedHighlightForColorChange, { color });
            setHighlightColorModalVisible(false);
            setSelectedHighlightForColorChange(null);
          }
        }}
      />
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
    maxHeight: 54,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    minWidth: 95,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 12,
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
  colorFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  colorFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#888',
    backgroundColor: 'transparent',
  },
  colorFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  colorFilterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listContent: {
    paddingVertical: 8,
  },
});
