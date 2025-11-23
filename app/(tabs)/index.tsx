import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { VerseCard } from "@/src/components/VerseCard";
import { ResumeReadingCard } from "@/src/components/ResumeReadingCard";
import { ProgressBar } from "@/src/components/ProgressBar";
import bibleService from "@/src/services/bibleService";
import { useBible } from "@/src/context/BibleContext";
import { Verse, BibleProgress, ResumeCardData } from "@/src/types";
import { useThemeColors } from "@/src/utils/theme";

export default function HomeScreen() {
  const { currentVersion, getBibleProgress, getResumeCardData } = useBible();
  const colors = useThemeColors();
  const router = useRouter();
  const [verseOfDay, setVerseOfDay] = React.useState<Verse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recentVerses, setRecentVerses] = React.useState<Verse[]>([]);
  const [bibleProgress, setBibleProgress] = React.useState<BibleProgress | null>(null);
  const [resumeCardData, setResumeCardData] = React.useState<ResumeCardData | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const verse = await bibleService.getVersesForDay(currentVersion);
      setVerseOfDay(verse);

      const chapter = await bibleService.getChapters(
        verse.book,
        verse.chapter,
        currentVersion
      );
      setRecentVerses(chapter.verses.slice(0, 3));

      // Load Bible progress
      const progress = await getBibleProgress();
      setBibleProgress(progress);

      // Load resume card data
      const resumeData = await getResumeCardData();
      setResumeCardData(resumeData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentVersion, getBibleProgress, getResumeCardData]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh progress when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleResumeReading = React.useCallback(
    (book: string, chapter: number, scrollPosition: number) => {
      router.push({
        pathname: "/chapter-detail",
        params: {
          bookName: book,
          chapterNumber: chapter.toString(),
          scrollPosition: scrollPosition.toString(),
          shouldAnimate: "true",
        },
      });
    },
    [router]
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <FlatList
        contentContainerStyle={styles.container}
        data={[
          { id: "header", type: "header" },
          { id: "resume", type: "resume" },
          { id: "progress", type: "progress" },
          ...(recentVerses.map((v) => ({ ...v, type: "verse" })) || []),
        ]}
        renderItem={({ item }: { item: any }) => {
          if (item.type === "header") {
            return (
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Bible App
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.secondaryText }]}
                >
                  Verse of the Day
                </Text>
              </View>
            );
          }
          if (item.type === "resume") {
            return (
              <ResumeReadingCard
                data={resumeCardData}
                onResume={handleResumeReading}
                isLoading={loading}
              />
            );
          }
          if (item.type === "progress" && bibleProgress) {
            return (
              <View style={[styles.progressCard, { backgroundColor: colors.secondaryBackground }]}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    Reading Progress
                  </Text>
                  <View style={styles.progressStats}>
                    <MaterialCommunityIcons name="book-check" size={16} color={colors.primary} />
                    <Text style={[styles.progressStat, { color: colors.text }]}>
                      {bibleProgress.booksCompleted}/{bibleProgress.totalBooks}
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={bibleProgress.percentageComplete}
                  height={8}
                  backgroundColor={colors.border}
                  progressColor={colors.primary}
                  borderRadius={4}
                  showLabel
                  label={`${bibleProgress.percentageComplete}% Complete`}
                  labelPosition="outside"
                  style={styles.mainProgressBar}
                  labelStyle={{ color: colors.text }}
                />
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {bibleProgress.chaptersRead}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.tertiaryText }]}>
                      Chapters Read
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {bibleProgress.booksStarted}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.tertiaryText }]}>
                      Books Started
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {bibleProgress.readingStats.chaptersReadToday}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.tertiaryText }]}>
                      Today
                    </Text>
                  </View>
                </View>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressStat: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainProgressBar: {
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
});
