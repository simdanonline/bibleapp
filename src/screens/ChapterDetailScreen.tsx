import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Verse, Chapter, CreateNoteRequest } from '../types';
import bibleService from '../services/bibleService';
import { useBible } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';
import { NoteButton } from '../components/NoteButton';
import { NoteInputModal } from '../components/NoteInputModal';

interface ChapterDetailScreenProps {
  bookId?: number;
  bookName: string;
  chapterNumber: number;
}

export const ChapterDetailScreen: React.FC<ChapterDetailScreenProps> = ({ bookId, bookName, chapterNumber }) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<Verse | null>(null);
  const colors = useThemeColors();
  const {
    currentVersion,
    isVerseBookmarked,
    isVerseFavorited,
    addBookmark,
    removeBookmark,
    addFavorite,
    removeFavorite,
    getNoteForVerse,
    hasNoteForVerse,
    addNote,
    updateNote,
    deleteNote,
  } = useBible();                                                                                                       
  const loadChapter = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bibleService.getChapters(bookName, chapterNumber, currentVersion);
      setChapter(data);
    } catch (e) {
      console.error('Error loading chapter:', e);
    } finally {
      setLoading(false);
    }
  }, [bookName, chapterNumber, currentVersion]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const handleShareVerse = async (verse: Verse) => {
    try {
      await Share.share({
        message: `${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}`,
        title: 'Share Verse',
      });
    } catch {
      Alert.alert('Error', 'Failed to share verse');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: colors.accent }]}>Failed to load chapter</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.header, { color: colors.text }]}>
          {chapter.book} {chapter.chapter}
        </Text>

      {chapter.verses.map((verse) => {
        const isBookmarked = isVerseBookmarked(verse.id);
        const isFavorited = isVerseFavorited(verse.id);
        const hasNote = hasNoteForVerse(verse.id);
        const note = getNoteForVerse(verse.id);

        const handleToggleBookmark = async () => {
          if (isBookmarked) {
            await removeBookmark(verse.id);
          } else {
            const bookmark = {
              id: verse.id,
              verseId: verse.id,
              book: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
              createdAt: new Date().toISOString(),
            };
            await addBookmark(bookmark);
          }
        };

        const handleToggleFavorite = async () => {
          if (isFavorited) {
            await removeFavorite(verse.id);
          } else {
            const favorite = {
              id: verse.id,
              verseId: verse.id,
              book: verse.book,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
              createdAt: new Date().toISOString(),
            };
            await addFavorite(favorite);
          }
        };

        const handleNotePress = () => {
          setSelectedVerseForNote(verse);
          setNoteModalVisible(true);
        };

        return (
          <View key={verse.id} style={[styles.verseContainer, { borderBottomColor: colors.border }]}>
            <View style={styles.verseHeader}>
              <Text style={[styles.verseNumber, { color: colors.primary }]}>{verse.verse}</Text>
            <View style={styles.verseActions}>
                <TouchableOpacity onPress={handleToggleBookmark}>
                  <MaterialCommunityIcons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={isBookmarked ? colors.primary : colors.tertiaryText}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionSpacing}>
                  <MaterialCommunityIcons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={18}
                    color={isFavorited ? colors.accent : colors.tertiaryText}
                  />
                </TouchableOpacity>
                <NoteButton hasNote={hasNote} onPress={handleNotePress} size={18} />
                <TouchableOpacity onPress={() => handleShareVerse(verse)} style={styles.actionSpacing}>
                  <MaterialCommunityIcons name="share-variant" size={18} color={colors.tertiaryText} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.verseText, { color: colors.text }]}>{verse.text}</Text>
          </View>
        );
      })}
      </ScrollView>

      <NoteInputModal
        visible={noteModalVisible}
        note={selectedVerseForNote ? getNoteForVerse(selectedVerseForNote.id) || undefined : undefined}
        onSave={async (data) => {
          if (selectedVerseForNote) {
            const note = getNoteForVerse(selectedVerseForNote.id);
            if (note && 'text' in data && !('verseId' in data)) {
              // Update mode
              await updateNote(note.id, data as any);
            } else {
              // Create mode
              await addNote(data as CreateNoteRequest);
            }
          }
        }}
        onDelete={
          selectedVerseForNote
            ? async () => {
                const note = getNoteForVerse(selectedVerseForNote.id);
                if (note) {
                  await deleteNote(note.id);
                }
              }
            : undefined
        }
        onCancel={() => {
          setNoteModalVisible(false);
          setSelectedVerseForNote(null);
        }}
        verseRef={
          selectedVerseForNote
            ? {
                book: selectedVerseForNote.book,
                chapter: selectedVerseForNote.chapter,
                verse: selectedVerseForNote.verse,
                version: currentVersion,
              }
            : undefined
        }
      />
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
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  verseContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionSpacing: {
    marginLeft: 4,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
  },
});
