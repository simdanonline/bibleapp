import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrossReferenceLink } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';
import bibleService from '@/src/services/bibleService';

interface CrossReferenceModalProps {
  visible: boolean;
  verseReference: {
    book: string;
    chapter: number;
    verse: number;
  };
  references: CrossReferenceLink[];
  onClose: () => void;
  onVersePress?: (book: string, chapter: number, verse: number) => void;
}

export const CrossReferenceModal: React.FC<CrossReferenceModalProps> = ({
  visible,
  verseReference,
  references,
  onClose,
  onVersePress,
}) => {
  const colors = useThemeColors();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());
  const [versePreviews, setVersionPreviews] = useState<Map<string, string>>(new Map());

  const filteredRefs = categoryFilter
    ? references.filter((ref) => ref.category === categoryFilter)
    : references;

  const categories = [...new Set(references.map((ref) => ref.category || 'Other'))];

  // Preload verse text for previews
  useEffect(() => {
    if (!visible) return;

    const preloadVerses = async () => {
      const toLoad = references.filter(
        (ref) => !ref.preview && !loadingPreviews.has(`${ref.book}.${ref.chapter}.${ref.startVerse}`)
      );

      if (toLoad.length === 0) return;

      const newLoading = new Set(loadingPreviews);
      toLoad.forEach((ref) => {
        newLoading.add(`${ref.book}.${ref.chapter}.${ref.startVerse}`);
      });
      setLoadingPreviews(newLoading);

      try {
        // Load previews in parallel
        await Promise.all(
          toLoad.map(async (ref) => {
            try {
              const chapter = await bibleService.getChapters(ref.book, ref.chapter);
              const verse = chapter.verses.find((v) => v.verse === ref.startVerse);
              if (verse) {
                const key = `${ref.book}.${ref.chapter}.${ref.startVerse}`;
                setVersionPreviews((prev) => new Map(prev).set(key, verse.text));
              }
            } catch {
              console.error(`Error loading preview for ${ref.book} ${ref.chapter}:${ref.startVerse}`);
            }
          })
        );
      } finally {
        setLoadingPreviews(new Set());
      }
    };

    preloadVerses();
  }, [visible, references, loadingPreviews]);

  const getCategoryColor = (category?: string) => {
    const categoryMap: { [key: string]: string } = {
      similar: '#3b82f6',
      parallel: '#8b5cf6',
      contrast: '#ef4444',
      fulfillment: '#10b981',
      quoted: '#f59e0b',
      prophecy: '#ec4899',
      referenced: '#06b6d4',
      related: '#6366f1',
    };
    return categoryMap[category || 'related'] || '#6366f1';
  };

  const getVersePreview = (ref: CrossReferenceLink) => {
    if (ref.preview) return ref.preview;
    const key = `${ref.book}.${ref.chapter}.${ref.startVerse}`;
    return versePreviews.get(key) || 'Loading...';
  };

  const handleReferencePress = (ref: CrossReferenceLink) => {
    if (onVersePress) {
      onVersePress(ref.book, ref.chapter, ref.startVerse);
    }
    onClose();
  };

  const renderReferenceItem = ({ item }: { item: CrossReferenceLink }) => (
    <TouchableOpacity
      style={[styles.referenceItem, { backgroundColor: colors.secondaryBackground }]}
      onPress={() => handleReferencePress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIndicator,
          { backgroundColor: getCategoryColor(item.category) },
        ]}
      />

      <View style={styles.referenceContent}>
        <View style={styles.referenceHeader}>
          <Text style={[styles.referenceTitle, { color: colors.text }]}>
            {item.book} {item.chapter}:{item.startVerse}
            {item.endVerse && item.endVerse !== item.startVerse ? `-${item.endVerse}` : ''}
          </Text>
          {item.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(item.category) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: getCategoryColor(item.category) },
                ]}
              >
                {item.category}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.referencePreview, { color: colors.secondaryText }]}
          numberOfLines={3}
        >
          &ldquo;{getVersePreview(item)}&rdquo;
        </Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.secondaryBackground }]}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: colors.text }]}>
              {verseReference.book} {verseReference.chapter}:{verseReference.verse}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
              {references.length} cross-reference{references.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Category Filter */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                !categoryFilter && { backgroundColor: colors.primary },
                { borderColor: colors.border },
              ]}
              onPress={() => setCategoryFilter(null)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: !categoryFilter ? 'white' : colors.text,
                  },
                ]}
              >
                All ({references.length})
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const count = references.filter((ref) => ref.category === cat).length;
              const isSelected = categoryFilter === cat;

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterButton,
                    isSelected && {
                      backgroundColor: getCategoryColor(cat),
                    },
                    { borderColor: getCategoryColor(cat) },
                  ]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: isSelected ? 'white' : getCategoryColor(cat),
                      },
                    ]}
                  >
                    {cat} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* References List */}
        <FlatList
          data={filteredRefs}
          renderItem={renderReferenceItem}
          keyExtractor={(item, index) =>
            `${item.book}-${item.chapter}-${item.startVerse}-${index}`
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="link-off" size={48} color={colors.tertiaryText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                No cross-references found
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.border },
              ]}
            />
          )}
        />

        {/* Loading Indicator for Previews */}
        {loadingPreviews.size > 0 && (
          <View style={[styles.loadingIndicator, { backgroundColor: colors.secondaryBackground }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Loading previews...
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  categoryIndicator: {
    width: 3,
    height: 60,
    borderRadius: 1.5,
  },
  referenceContent: {
    flex: 1,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  referencePreview: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    marginVertical: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
