import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { VerseCard } from "../components/VerseCard";
import bibleService from "../services/bibleService";
import { useBible } from "../context/BibleContext";
import { Verse } from "../types";

export const HomeScreen: React.FC = () => {
  const { currentVersion } = useBible();
  const [verseOfDay, setVerseOfDay] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentVerses, setRecentVerses] = useState<Verse[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const verse = await bibleService.getVersesForDay(currentVersion);
      setVerseOfDay(verse);

      // Get some recent verses
      const chapter = await bibleService.getChapters(
        verse.book,
        verse.chapter,
        currentVersion
      );
      setRecentVerses(chapter.verses.slice(0, 3));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentVersion]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={[
        { id: "header", type: "header" },
        ...(recentVerses.map((v) => ({ ...v, type: "verse" })) || []),
      ]}
      renderItem={({ item }: { item: any }) => {
        if (item.type === "header") {
          return (
            <View style={styles.header}>
              <Text style={styles.title}>Bible App</Text>
              <Text style={styles.subtitle}>Verse of the Days</Text>
            </View>
          );
        }
        return (
          <View>
            {verseOfDay && <VerseCard verse={verseOfDay} />}
            <VerseCard verse={item} />
          </View>
        );
      }}
      keyExtractor={(item, index) => index.toString()}
      scrollEnabled
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
});
