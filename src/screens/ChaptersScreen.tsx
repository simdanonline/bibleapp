import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BIBLE_BOOKS } from "../services/bibleService";
import { useThemeColors } from "../utils/theme";

interface ChaptersScreenProps {
  bookId: number;
  bookName: string;
}

export const ChaptersScreen: React.FC<ChaptersScreenProps> = ({
  bookId,
  bookName,
}) => {
  const router = useRouter();
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  useEffect(() => {
    const loadChapters = async () => {
      try {
        setLoading(true);
        // Get chapter count from BIBLE_BOOKS
        const book = BIBLE_BOOKS.find((b) => b.name === bookName);
        const chapterCount = book?.chapters || 1;
        const chapterArray = Array.from(
          { length: chapterCount },
          (_, i) => i + 1
        );
        setChapters(chapterArray);
      } catch (error) {
        console.error("Error loading chapters:", error);
      } finally {
        setLoading(false);
      }
    };
    loadChapters();
  }, [bookId, bookName]);

  const handleSelectChapter = (chapterNumber: number) => {
    router.push({
      pathname: "/chapter-detail",
      params: {
        bookId,
        bookName,
        chapterNumber,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const renderChapter = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={styles.chapterButton}
      onPress={() => handleSelectChapter(item)}
    >
      <Text style={[styles.chapterText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: colors.text }]}>{bookName}</Text>
        <FlatList
          data={chapters}
          renderItem={renderChapter}
          keyExtractor={(item) => item.toString()}
          numColumns={5}
          contentContainerStyle={styles.gridContent}
          scrollEnabled
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  gridContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  chapterButton: {
    flex: 1,
    margin: 8,
    paddingVertical: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chapterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
  },
});
