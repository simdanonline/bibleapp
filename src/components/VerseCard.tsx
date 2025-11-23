import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Verse, CrossReferenceLink } from '../types';
import { useBible } from '../context/BibleContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { CrossReferenceCard } from './CrossReferenceCard';
import { CrossReferenceModal } from './CrossReferenceModal';

interface VerseCardProps {
  verse: Verse;
  onPress?: () => void;
  onVerseNavigate?: (book: string, chapter: number, verse: number) => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({ verse, onPress, onVerseNavigate }) => {
  const { isVerseBookmarked, isVerseFavorited, addBookmark, removeBookmark, addFavorite, removeFavorite, getVerseReferences, isCrossRefReady, preloadChapter } = useBible();
  const colors = useThemeColors();
  const [crossReferences, setCrossReferences] = useState<CrossReferenceLink[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);

  const isBookmarked = isVerseBookmarked(verse.id);
  const isFavorited = isVerseFavorited(verse.id);

  // Load cross-references on mount and preload adjacent chapter
  useEffect(() => {
    const loadReferences = async () => {
      try {
        // Check if service is ready
        if (!isCrossRefReady()) {
          console.warn('Cross-reference service not ready yet');
          return;
        }

        setLoadingReferences(true);
        const refs = await getVerseReferences(verse.book, verse.chapter, verse.verse);
        console.log(`[VerseCard] Loaded ${refs.length} cross-references for ${verse.book} ${verse.chapter}:${verse.verse}`);
        setCrossReferences(refs);

        // Preload adjacent chapters in background
        try {
          await preloadChapter(verse.book, verse.chapter);
          console.log(`[VerseCard] Preloaded adjacent chapters for ${verse.book} ${verse.chapter}`);
        } catch {
          console.log('[VerseCard] Preload completed (no error)');
        }
      } catch (error) {
        console.error('[VerseCard] Error loading cross-references:', error);
        setCrossReferences([]);
      } finally {
        setLoadingReferences(false);
      }
    };

    loadReferences();
  }, [verse.book, verse.chapter, verse.verse, getVerseReferences, isCrossRefReady, preloadChapter]);
  // console.log(crossReferences);

  const handleToggleBookmark = async () => {
    if (isBookmarked) {
      const bookmark = { id: verse.id, verseId: verse.id, book: verse.book, chapter: verse.chapter, verse: verse.verse, text: verse.text, createdAt: new Date().toISOString() };
      await removeBookmark(bookmark.id);
    } else {
      const bookmark = { id: verse.id, verseId: verse.id, book: verse.book, chapter: verse.chapter, verse: verse.verse, text: verse.text, createdAt: new Date().toISOString() };
      await addBookmark(bookmark);
    }
  };

  const handleToggleFavorite = async () => {
    if (isFavorited) {
      await removeFavorite(verse.id);
    } else {
      const favorite = { id: verse.id, verseId: verse.id, book: verse.book, chapter: verse.chapter, verse: verse.verse, text: verse.text, createdAt: new Date().toISOString() };
      await addFavorite(favorite);
    }
  };

  return (
    <>
      <TouchableOpacity style={[styles.container, { backgroundColor: colors.secondaryBackground, borderLeftColor: colors.primary }]} onPress={onPress}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.reference, { color: colors.primary }]}>
              {verse.book} {verse.chapter}:{verse.verse}
            </Text>
            {crossReferences.length > 0 && (
              <View style={[styles.referenceBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.referenceBadgeText}>{crossReferences.length}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>{verse.text}</Text>

          {/* Cross-References Section */}
          {loadingReferences && (
            <View style={styles.loadingReferences}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading references...</Text>
            </View>
          )}

          {!loadingReferences && crossReferences.length > 0 && (
            <TouchableOpacity
              style={[styles.crossRefContainer, { borderTopColor: colors.border }]}
              onPress={() => setShowReferencesModal(true)}
            >
              <MaterialCommunityIcons name="link-variant" size={16} color={colors.primary} />
              <Text style={[styles.crossRefText, { color: colors.primary }]}>
                {crossReferences.length} cross-reference{crossReferences.length !== 1 ? 's' : ''}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.secondaryText} />
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            <TouchableOpacity onPress={handleToggleBookmark} style={styles.actionButton}>
              <MaterialCommunityIcons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? colors.primary : colors.tertiaryText}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionButton}>
              <MaterialCommunityIcons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorited ? colors.accent : colors.tertiaryText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Cross-Reference Modal */}
      <CrossReferenceModal
        visible={showReferencesModal}
        verseReference={{
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
        }}
        references={crossReferences}
        onClose={() => setShowReferencesModal(false)}
        onVersePress={(book, chapter, verseNum) => {
          setShowReferencesModal(false);
          onVerseNavigate?.(book, chapter, verseNum);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
  },
  referenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  referenceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  loadingReferences: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  crossRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  crossRefText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});
