import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrossReferenceLink } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';

interface CrossReferenceCardProps {
  references: CrossReferenceLink[];
  onVersePress?: (book: string, chapter: number, verse: number) => void;
  compact?: boolean; // Show minimal version in verse card
}

export const CrossReferenceCard: React.FC<CrossReferenceCardProps> = ({
  references,
  onVersePress,
  compact = false,
}) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(!compact);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const filteredRefs = categoryFilter
    ? references.filter((ref) => ref.category === categoryFilter)
    : references;

  const categories = [...new Set(references.map((ref) => ref.category || 'Other'))];

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

  const renderReferenceItem = ({ item }: { item: CrossReferenceLink }) => (
    <TouchableOpacity
      style={[styles.referenceItem, { backgroundColor: colors.secondaryBackground }]}
      onPress={() => {
        if (onVersePress) {
          onVersePress(item.book, item.chapter, item.startVerse);
        }
      }}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIndicator,
          { backgroundColor: getCategoryColor(item.category) },
        ]}
      />
      <View style={styles.referenceContent}>
        <Text style={[styles.referenceTitle, { color: colors.text }]}>
          {item.book} {item.chapter}:{item.startVerse}
          {item.endVerse && item.endVerse !== item.startVerse ? `-${item.endVerse}` : ''}
        </Text>
        {item.preview && (
          <Text style={[styles.referencePreview, { color: colors.secondaryText }]} numberOfLines={2}>
            {item.preview}
          </Text>
        )}
        {item.category && (
          <View style={styles.categoryTag}>
            <Text style={[styles.categoryTagText, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  if (references.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.secondaryBackground }]}>
        <TouchableOpacity
          style={styles.compactHeader}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.compactHeaderLeft}>
            <MaterialCommunityIcons name="link-variant" size={16} color={colors.primary} />
            <Text style={[styles.compactTitle, { color: colors.text }]}>
              {references.length} Cross-reference{references.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.secondaryText}
          />
        </TouchableOpacity>

        {expanded && (
          <>
            {categories.length > 1 && (
              <View style={styles.categoryFilter}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    !categoryFilter && { backgroundColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setCategoryFilter(null)}
                >
                  <Text style={[styles.filterText, !categoryFilter && { color: 'white' }]}>
                    All ({references.length})
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const count = references.filter((ref) => ref.category === cat).length;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterButton,
                        categoryFilter === cat && {
                          backgroundColor: getCategoryColor(cat),
                        },
                        { borderColor: getCategoryColor(cat) },
                      ]}
                      onPress={() => setCategoryFilter(cat)}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          categoryFilter === cat && { color: 'white' },
                          { color: getCategoryColor(cat) },
                        ]}
                      >
                        {cat} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <FlatList
              data={filteredRefs}
              renderItem={renderReferenceItem}
              keyExtractor={(item, index) =>
                `${item.book}-${item.chapter}-${item.startVerse}-${index}`
              }
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            />
          </>
        )}
      </View>
    );
  }

  // Full modal view layout
  return (
    <View style={[styles.container, { backgroundColor: colors.secondaryBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Cross-References ({references.length})
        </Text>
      </View>

      {categories.length > 1 && (
        <View style={styles.categoryFilter}>
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
                !categoryFilter && { color: 'white' },
                { color: !categoryFilter ? 'white' : colors.text },
              ]}
            >
              All ({references.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const count = references.filter((ref) => ref.category === cat).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterButton,
                  categoryFilter === cat && {
                    backgroundColor: getCategoryColor(cat),
                  },
                  { borderColor: getCategoryColor(cat) },
                ]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    categoryFilter === cat && { color: 'white' },
                    { color: getCategoryColor(cat) },
                  ]}
                >
                  {cat} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <FlatList
        data={filteredRefs}
        renderItem={renderReferenceItem}
        keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.startVerse}-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: colors.border },
            ]}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  compactContainer: {
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  categoryIndicator: {
    width: 3,
    height: 50,
    borderRadius: 1.5,
    marginTop: 2,
  },
  referenceContent: {
    flex: 1,
  },
  referenceTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  referencePreview: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    marginHorizontal: 12,
  },
});
