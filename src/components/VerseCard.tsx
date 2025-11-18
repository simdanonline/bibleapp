import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Verse } from '../types';
import { useBible } from '../context/BibleContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';

interface VerseCardProps {
  verse: Verse;
  onPress?: () => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({ verse, onPress }) => {
  const { isVerseBookmarked, isVerseFavorited, addBookmark, removeBookmark, addFavorite, removeFavorite } = useBible();
  const colors = useThemeColors();

  const isBookmarked = isVerseBookmarked(verse.id);
  const isFavorited = isVerseFavorited(verse.id);

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
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.secondaryBackground, borderLeftColor: colors.primary }]} onPress={onPress}>
      <View style={styles.content}>
        <Text style={[styles.reference, { color: colors.primary }]}>
          {verse.book} {verse.chapter}:{verse.verse}
        </Text>
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>{verse.text}</Text>
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
  reference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});
