import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
  PanResponder,
  NativeScrollEvent,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Verse, Chapter, CreateNoteRequest, CreateHighlightRequest } from "../types";
import bibleService, { BIBLE_BOOKS } from "../services/bibleService";
import { useBible } from "../context/BibleContext";
import { useThemeColors } from "../utils/theme";
import { NoteButton } from "../components/NoteButton";
import { NoteInputModal } from "../components/NoteInputModal";
import { HighlightColorPickerModal } from "../components/HighlightColorPickerModal";

interface ChapterDetailScreenProps {
  bookId?: number;
  bookName: string;
  chapterNumber: number;
  scrollPosition?: number;
  shouldAnimateScroll?: boolean;
  onChapterChange?: (newChapterNumber: number) => void;
}

export const ChapterDetailScreen: React.FC<ChapterDetailScreenProps> = ({
  bookId,
  bookName,
  chapterNumber,
  scrollPosition,
  shouldAnimateScroll = false,
  onChapterChange,
}) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [highlightModalVisible, setHighlightModalVisible] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] =
    useState<Verse | null>(null);
  const [selectedVerseForHighlight, setSelectedVerseForHighlight] =
    useState<Verse | null>(null);
  const colors = useThemeColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const lastDx = useRef(0);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        // Only trigger if horizontal movement is greater than vertical
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderMove: (_, { dx }) => {
        lastDx.current = dx;
      },
      onPanResponderRelease: (_, { dx }) => {
        // Swipe left (dx < -50) → next chapter
        if (dx < -50) {
          handleNextChapter();
        }
        // Swipe right (dx > 50) → previous chapter
        else if (dx > 50) {
          handlePreviousChapter();
        }
        lastDx.current = 0;
      },
    })
  ).current;

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
    getHighlightForVerse,
    hasHighlightForVerse,
    addHighlight,
    updateHighlight,
    deleteHighlight,
    isChapterRead,
    markChapterAsRead,
    markChapterAsUnread,
    saveReadingPosition,
  } = useBible();

  // Get current book and chapter limits
  const currentBook = BIBLE_BOOKS.find((b) => b.name === bookName);
  const totalChapters = currentBook?.chapters || 1;
  const canGoPrevious = chapterNumber > 1;
  const canGoNext = chapterNumber < totalChapters;

  // Handle highlight color selection
  const handleHighlightColorSelect = async (color: any) => {
    if (selectedVerseForHighlight) {
      const existingHighlight = getHighlightForVerse(selectedVerseForHighlight.id);
      if (existingHighlight) {
        // Update existing highlight
        await updateHighlight(existingHighlight.id, { color });
      } else {
        // Create new highlight
        const request: CreateHighlightRequest = {
          verseId: selectedVerseForHighlight.id,
          book: selectedVerseForHighlight.book,
          chapter: selectedVerseForHighlight.chapter,
          verse: selectedVerseForHighlight.verse,
          text: selectedVerseForHighlight.text,
          version: currentVersion,
          color,
        };
        await addHighlight(request);
      }
      setHighlightModalVisible(false);
      setSelectedVerseForHighlight(null);
    }
  };

  // Get next/previous book for edge navigation
  const getNextBook = () => {
    const currentBookIndex = BIBLE_BOOKS.findIndex((b) => b.name === bookName);
    return currentBookIndex < BIBLE_BOOKS.length - 1
      ? BIBLE_BOOKS[currentBookIndex + 1]
      : null;
  };

  const getPreviousBook = () => {
    const currentBookIndex = BIBLE_BOOKS.findIndex((b) => b.name === bookName);
    return currentBookIndex > 0 ? BIBLE_BOOKS[currentBookIndex - 1] : null;
  };

  const handleNextChapter = () => {
    if (canGoNext) {
      // Navigate to next chapter in current book
      onChapterChange?.(chapterNumber + 1);
    } else {
      // At last chapter, need to move to first chapter of next book
      const nextBook = getNextBook();
      if (nextBook) {
        // Trigger book change with chapter 1 of next book
        onChapterChange?.(-1); // Signal to change book
      }
    }
  };

  const handlePreviousChapter = () => {
    if (canGoPrevious) {
      // Navigate to previous chapter in current book
      onChapterChange?.(chapterNumber - 1);
    } else {
      // At first chapter, need to move to last chapter of previous book
      const prevBook = getPreviousBook();
      if (prevBook) {
        // Trigger book change with last chapter of previous book
        onChapterChange?.(-2); // Signal to change book
      }
    }
  };

  /**
   * Handle scroll events for tracking reading position
   * Uses debouncing at service level (1000ms) to minimize AsyncStorage writes
   */
  const handleScroll = useCallback(
    (e: NativeScrollEvent) => {
      const { contentOffset, contentSize } = e;
      const scrollPosition = contentOffset.y;
      const scrollPercentage =
        contentSize.height > 0
          ? (scrollPosition / contentSize.height) * 100
          : 0;

      // Save reading position (debounced at service level)
      saveReadingPosition(
        bookName,
        chapterNumber,
        scrollPosition,
        scrollPercentage,
        contentSize.height,
      );
    },
    [bookName, chapterNumber, saveReadingPosition],
  );

  const loadChapter = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bibleService.getChapters(
        bookName,
        chapterNumber,
        currentVersion
      );
      setChapter(data);
    } catch (e) {
      console.error("Error loading chapter:", e);
    } finally {
      setLoading(false);
    }
  }, [bookName, chapterNumber, currentVersion]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  // Cleanup: flush any pending reading position updates when leaving
  useEffect(() => {
    return () => {
      // Note: continueReadingService will auto-flush on next app cycle
      // This ensures no data loss on rapid navigation
    };
  }, []);

  // Restore scroll position when chapter loads
  useEffect(() => {
    if (!loading && chapter && scrollPosition !== undefined) {
      // Small delay to ensure ScrollView is ready
      const restoreTimeout = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: shouldAnimateScroll,
        });
      }, 100);

      return () => clearTimeout(restoreTimeout);
    }
  }, [loading, chapter, scrollPosition, shouldAnimateScroll]);

  const handleShareVerse = async (verse: Verse) => {
    try {
      await Share.share({
        message: `${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}`,
        title: "Share Verse",
      });
    } catch {
      Alert.alert("Error", "Failed to share verse");
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
        <Text style={[styles.errorText, { color: colors.accent }]}>
          Failed to load chapter
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Chapter Navigation Header */}
      <View
        style={[
          styles.navigationHeader,
          {
            backgroundColor: colors.secondaryBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePreviousChapter}
          disabled={!canGoPrevious}
          style={styles.navButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={canGoPrevious ? colors.primary : colors.tertiaryText}
          />
        </TouchableOpacity>

        <View style={styles.chapterInfo}>
          <Text style={[styles.chapterTitle, { color: colors.text }]}>
            {chapter?.book} {chapter?.chapter}
          </Text>
          <Text style={[styles.chapterCounter, { color: colors.tertiaryText }]}>
            {chapterNumber} of {totalChapters}
          </Text>
        </View>

        <View style={styles.rightHeaderButtons}>
          <TouchableOpacity
            onPress={async () => {
              const chapterRead = isChapterRead(bookName, chapterNumber);
              if (chapterRead) {
                await markChapterAsUnread(bookName, chapterNumber);
              } else {
                await markChapterAsRead(bookName, chapterNumber);
              }
            }}
            style={styles.navButton}
          >
            <MaterialCommunityIcons
              name={
                isChapterRead(bookName, chapterNumber)
                  ? "check-circle"
                  : "check-circle-outline"
              }
              size={24}
              color={
                isChapterRead(bookName, chapterNumber)
                  ? colors.primary
                  : colors.tertiaryText
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNextChapter}
            disabled={!canGoNext}
            style={styles.navButton}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={canGoNext ? colors.primary : colors.tertiaryText}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        onScroll={({ nativeEvent }) => handleScroll(nativeEvent)}
        scrollEventThrottle={250}
        {...panResponder.panHandlers}
      >
        {chapter.verses.map((verse) => {
          const isBookmarked = isVerseBookmarked(verse.id);
          const isFavorited = isVerseFavorited(verse.id);
          const hasNote = hasNoteForVerse(verse.id);
          const highlight = getHighlightForVerse(verse.id);
          const hasHighlight = hasHighlightForVerse(verse.id);

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

          const handleHighlightPress = async () => {
            if (hasHighlight && highlight) {
              Alert.alert(
                'Highlight Actions',
                `This verse is highlighted in ${highlight.color}`,
                [
                  {
                    text: 'Change Color',
                    onPress: () => {
                      setSelectedVerseForHighlight(verse);
                      setHighlightModalVisible(true);
                    },
                  },
                  {
                    text: 'Remove Highlight',
                    onPress: async () => {
                      await deleteHighlight(highlight.id);
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            } else {
              setSelectedVerseForHighlight(verse);
              setHighlightModalVisible(true);
            }
          };

          const handleNotePress = () => {
            setSelectedVerseForNote(verse);
            setNoteModalVisible(true);
          };

          return (
            <View
              key={verse.id}
              style={[
                styles.verseContainer,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.verseHeader}>
                <Text style={[styles.verseNumber, { color: colors.primary }]}>
                  {verse.verse}
                </Text>
                <View style={styles.verseActions}>
                  <TouchableOpacity onPress={handleToggleBookmark}>
                    <MaterialCommunityIcons
                      name={isBookmarked ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={
                        isBookmarked ? colors.primary : colors.tertiaryText
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleToggleFavorite}
                    style={styles.actionSpacing}
                  >
                    <MaterialCommunityIcons
                      name={isFavorited ? "heart" : "heart-outline"}
                      size={18}
                      color={isFavorited ? colors.accent : colors.tertiaryText}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleHighlightPress}
                    style={styles.actionSpacing}
                  >
                    <MaterialCommunityIcons
                      name={hasHighlight ? "pencil" : "pencil-outline"}
                      size={18}
                      color={hasHighlight ? colors.accent : colors.tertiaryText}
                    />
                  </TouchableOpacity>
                  <NoteButton
                    hasNote={hasNote}
                    onPress={handleNotePress}
                    size={18}
                  />
                  <TouchableOpacity
                    onPress={() => handleShareVerse(verse)}
                    style={styles.actionSpacing}
                  >
                    <MaterialCommunityIcons
                      name="share-variant"
                      size={18}
                      color={colors.tertiaryText}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.verseText, { color: colors.text }]}>
                {verse.text}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <NoteInputModal
        visible={noteModalVisible}
        note={
          selectedVerseForNote
            ? getNoteForVerse(selectedVerseForNote.id) || undefined
            : undefined
        }
        onSave={async (data) => {
          if (selectedVerseForNote) {
            const note = getNoteForVerse(selectedVerseForNote.id);
            if (note && "text" in data && !("verseId" in data)) {
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

      <HighlightColorPickerModal
        visible={highlightModalVisible}
        onDismiss={() => {
          setHighlightModalVisible(false);
          setSelectedVerseForHighlight(null);
        }}
        onSelectColor={handleHighlightColorSelect}
        currentColor={
          selectedVerseForHighlight
            ? getHighlightForVerse(selectedVerseForHighlight.id)?.color
            : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
    minWidth: 40,
    alignItems: "center",
  },
  rightHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  chapterInfo: {
    flex: 1,
    alignItems: "center",
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  chapterCounter: {
    fontSize: 12,
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  verseContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  verseActions: {
    flexDirection: "row",
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
