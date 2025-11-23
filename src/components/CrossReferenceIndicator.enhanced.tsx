/**
 * Enhanced Cross-Reference Indicator Component
 * Features:
 * - Compact indicator showing reference count
 * - Expandable modal with category filters
 * - Verse previews on demand
 * - Navigation to referenced verses
 * - Performance optimized with React.memo
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  SectionList,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrossReferenceLink, CrossReferenceCategory } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';
import crossReferenceService from '@/src/services/crossReferenceService';

interface CrossReferenceIndicatorProps {
  verseId: string;
  references: CrossReferenceLink[];
  onVersePress?: (book: string, chapter: number, verse: number) => void;
  compact?: boolean;
}

// Category colors
const CATEGORY_COLORS: Record<CrossReferenceCategory, string> = {
  similar: '#3b82f6',        // blue
  parallel: '#8b5cf6',       // purple
  contrast: '#ef4444',       // red
  fulfillment: '#10b981',    // emerald
  quoted: '#f59e0b',         // amber
  prophecy: '#ec4899',       // pink
  referenced: '#06b6d4',     // cyan
  related: '#6366f1',        // indigo
  other: '#6b7280',          // gray
};

const CATEGORY_LABELS: Record<CrossReferenceCategory, string> = {
  similar: 'Similar',
  parallel: 'Parallel',
  contrast: 'Contrast',
  fulfillment: 'Fulfillment',
  quoted: 'Quoted',
  prophecy: 'Prophecy',
  referenced: 'Referenced',
  related: 'Related',
  other: 'Other',
};

/**
 * Reference Item Component
 */
interface ReferenceItemProps {
  item: CrossReferenceLink;
  onPress: (ref: CrossReferenceLink) => void;
  colors: any;
  showPreview: boolean;
}

const ReferenceItem = React.memo<ReferenceItemProps>(({ item, onPress, colors, showPreview }) => {
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const loadPreview = useCallback(() => {
    if (showPreview && !previewText && !loadingPreview && !item.preview) {
      setLoadingPreview(true);
      // Simulate loading preview (in real app, would fetch verse text)
      setTimeout(() => {
        setPreviewText('Sample verse text preview...');
        setLoadingPreview(false);
      }, 100);
    }
  }, [item.preview, loadingPreview, previewText, showPreview]);

  const displayPreview = item.preview || previewText;
  const categoryColor = item.category && item.category in CATEGORY_COLORS ? CATEGORY_COLORS[item.category as CrossReferenceCategory] : CATEGORY_COLORS.other;

  return (
    <TouchableOpacity
      style={[styles.referenceItem, { backgroundColor: colors.secondaryBackground, borderLeftColor: categoryColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
      onLayout={loadPreview}
    >
      <View style={styles.referenceContent}>
        <View style={styles.referenceHeader}>
          <Text style={[styles.referenceTitle, { color: colors.text }]}>
            {item.book} {item.chapter}:{item.startVerse}
            {item.endVerse && item.endVerse !== item.startVerse ? `–${item.endVerse}` : ''}
          </Text>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryBadgeText}>{item.category in CATEGORY_LABELS ? CATEGORY_LABELS[item.category as CrossReferenceCategory] : 'Other'}</Text>
            </View>
          )}
        </View>

        {displayPreview && (
          <Text style={[styles.referencePreview, { color: colors.secondaryText }]} numberOfLines={2}>
            {displayPreview}
          </Text>
        )}

        {loadingPreview && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loadingPreview} />
        )}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.secondaryText} />
    </TouchableOpacity>
  );
});

ReferenceItem.displayName = 'ReferenceItem';

/**
 * Main Cross-Reference Indicator Component
 */
const CrossReferenceIndicator: React.FC<CrossReferenceIndicatorProps> = React.memo(
  ({ verseId, references, onVersePress, compact = false }) => {
    const colors = useThemeColors();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<Set<CrossReferenceCategory>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'category' | 'book'>('category');

    // Get unique categories
    const categories = useMemo(() => {
      const cats = new Set<CrossReferenceCategory>();
      references.forEach((ref) => {
        if (ref.category && (ref.category as string) in CATEGORY_LABELS) {
          cats.add(ref.category as CrossReferenceCategory);
        }
      });
      return Array.from(cats).sort();
    }, [references]);

    // Filter and sort references
    const filteredReferences = useMemo(() => {
      let filtered = references;

      // Filter by category
      if (selectedCategories.size > 0) {
        filtered = filtered.filter((ref) => selectedCategories.has((ref.category || 'other') as CrossReferenceCategory));
      }

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (ref) =>
            ref.book.toLowerCase().includes(query) ||
            ref.chapter.toString().includes(query) ||
            ref.startVerse.toString().includes(query)
        );
      }

      // Sort
      if (sortBy === 'category') {
        filtered = [...filtered].sort((a, b) => {
          const catA = a.category || 'other';
          const catB = b.category || 'other';
          return catA.localeCompare(catB);
        });
      } else if (sortBy === 'book') {
        filtered = [...filtered].sort((a, b) => a.book.localeCompare(b.book));
      }

      return filtered;
    }, [references, selectedCategories, searchQuery, sortBy]);

    // Group by category for SectionList
    const groupedReferences = useMemo(() => {
      const grouped: Record<string, CrossReferenceLink[]> = {};

      filteredReferences.forEach((ref) => {
        const category = ref.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(ref);
      });

      return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, data]) => ({
          title: `${CATEGORY_LABELS[title as CrossReferenceCategory]} (${data.length})`,
          data,
          category: title,
        }));
    }, [filteredReferences]);

    const toggleCategory = useCallback((cat: CrossReferenceCategory) => {
      setSelectedCategories((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(cat)) {
          newSet.delete(cat);
        } else {
          newSet.add(cat);
        }
        return newSet;
      });
    }, []);

    const handleReferencePress = useCallback(
      (ref: CrossReferenceLink) => {
        if (onVersePress) {
          onVersePress(ref.book, ref.chapter, ref.startVerse);
        }
        setModalVisible(false);
      },
      [onVersePress]
    );

    if (references.length === 0) {
      return null;
    }

    // Compact mode: show as collapsible indicator
    if (compact) {
      return (
        <View style={[styles.compactContainer, { backgroundColor: colors.secondaryBackground }]}>
          <TouchableOpacity
            style={styles.compactButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="link-variant" size={16} color={colors.primary} />
            <Text style={[styles.compactText, { color: colors.text }]}>
              {references.length} reference{references.length !== 1 ? 's' : ''}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.secondaryText} />
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setModalVisible(false)}
          >
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { backgroundColor: colors.secondaryBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Cross-References</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Search Bar */}
              <View
                style={[styles.searchContainer, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="magnify" size={20} color={colors.secondaryText} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search references..."
                  placeholderTextColor={colors.secondaryText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close" size={18} color={colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter */}
              {categories.length > 1 && (
                <View style={styles.filterContainer}>
                  <FlatList
                    data={categories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item: category }) => {
                      const isSelected = selectedCategories.has(category);
                      const catColor = CATEGORY_COLORS[category];

                      return (
                        <TouchableOpacity
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: isSelected ? catColor : colors.secondaryBackground,
                              borderColor: catColor,
                            },
                          ]}
                          onPress={() => toggleCategory(category)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              { color: isSelected ? '#ffffff' : catColor },
                            ]}
                          >
                            {CATEGORY_LABELS[category]}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.filterList}
                  />
                </View>
              )}

              {/* Sort Options */}
              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'category' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setSortBy('category')}
                >
                  <Text style={[styles.sortButtonText, { color: colors.text }]}>By Category</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'book' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                  ]}
                  onPress={() => setSortBy('book')}
                >
                  <Text style={[styles.sortButtonText, { color: colors.text }]}>By Book</Text>
                </TouchableOpacity>
              </View>

              {/* References List */}
              {sortBy === 'category' && filteredReferences.length > 0 ? (
                <SectionList
                  sections={groupedReferences}
                  keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.startVerse}-${index}`}
                  renderItem={({ item }) => (
                    <ReferenceItem
                      item={item}
                      onPress={handleReferencePress}
                      colors={colors}
                      showPreview={true}
                    />
                  )}
                  renderSectionHeader={({ section: { title, category } }) => (
                    <View
                      style={[
                        styles.sectionHeader,
                        { backgroundColor: colors.background, borderLeftColor: CATEGORY_COLORS[category as CrossReferenceCategory] },
                      ]}
                    >
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                    </View>
                  )}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                <FlatList
                  data={filteredReferences}
                  keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.startVerse}-${index}`}
                  renderItem={({ item }) => (
                    <ReferenceItem
                      item={item}
                      onPress={handleReferencePress}
                      colors={colors}
                      showPreview={true}
                    />
                  )}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.secondaryText} />
                      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No references found</Text>
                    </View>
                  }
                />
              )}

              {/* Info Footer */}
              <View style={[styles.infoFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.infoText, { color: colors.secondaryText }]}>
                  {filteredReferences.length} of {references.length} reference{references.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </SafeAreaView>
          </Modal>
        </View>
      );
    }

    // Non-compact mode: always expanded inline
    return (
      <View style={styles.expandedContainer}>
        <View style={[styles.expandedHeader, { backgroundColor: colors.secondaryBackground }]}>
          <MaterialCommunityIcons name="link-variant" size={18} color={colors.primary} />
          <Text style={[styles.expandedTitle, { color: colors.text }]}>
            Cross-References ({references.length})
          </Text>
        </View>

        <FlatList
          data={filteredReferences}
          keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.startVerse}-${index}`}
          renderItem={({ item }) => (
            <ReferenceItem item={item} onPress={handleReferencePress} colors={colors} showPreview={false} />
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.inlineListContent}
        />
      </View>
    );
  }
);

CrossReferenceIndicator.displayName = 'CrossReferenceIndicator';

const styles = StyleSheet.create({
  // Compact Mode
  compactContainer: {
    marginVertical: 8,
    borderRadius: 8,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    marginRight: 8,
  },
  headerSpacer: {
    width: 32,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
  },

  // Filters
  filterContainer: {
    paddingVertical: 8,
  },
  filterList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Sort
  sortContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inlineListContent: {
    paddingVertical: 8,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 12,
  },
  referenceContent: {
    flex: 1,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  referenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  referencePreview: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingPreview: {
    marginTop: 4,
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },

  // Info Footer
  infoFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
  },

  // Expanded Mode
  expandedContainer: {
    marginVertical: 8,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 8,
    gap: 8,
  },
  expandedTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export const CrossReferenceIndicator_Enhanced = CrossReferenceIndicator;
export default CrossReferenceIndicator;
