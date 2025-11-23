import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReadingPlanMetadata, ReadingPlanEnrollment, ReadingPlanStats } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';
import readingPlanService from '@/src/services/readingPlanService';
import { ProgressBar } from '@/src/components/ProgressBar';

export default function PlanDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { planId } = useLocalSearchParams();

  const [plan, setPlan] = useState<ReadingPlanMetadata | null>(null);
  const [enrollment, setEnrollment] = useState<ReadingPlanEnrollment | null>(null);
  const [stats, setStats] = useState<ReadingPlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      if (!planId) return;

      const planData = await readingPlanService.getReadingPlan(planId as string);
      setPlan(planData);

      // Check if user is enrolled
      const enrollments = await readingPlanService.getUserEnrollments();
      const userEnrollment = enrollments.find(
        (e) => e.planId === planId && e.status === 'active'
      );
      setEnrollment(userEnrollment || null);

      // Load stats if enrolled
      if (userEnrollment && planData) {
        const statsData = await readingPlanService.calculateStats(
          userEnrollment.id,
          planData.duration
        );
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading plan details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const handleEnroll = async () => {
    if (!plan) return;

    try {
      const newEnrollment = await readingPlanService.enrollInPlan(plan.id, plan.name);
      setEnrollment(newEnrollment);

      const statsData = await readingPlanService.calculateStats(
        newEnrollment.id,
        plan.duration
      );
      setStats(statsData);

      Alert.alert('Success', `Enrolled in ${plan.name}!`);
    } catch (error) {
      console.error('Error enrolling in plan:', error);
      Alert.alert('Error', 'Failed to enroll in plan');
    }
  };

  const handleStartReading = async () => {
    if (!enrollment || !plan) return;

    try {
      // Mark current day as complete
      const updatedEnrollment = await readingPlanService.completeDay(
        enrollment.id,
        enrollment.currentDay
      );
      setEnrollment(updatedEnrollment);

      // Recalculate stats
      const statsData = await readingPlanService.calculateStats(
        enrollment.id,
        plan.duration
      );
      setStats(statsData);

      // Navigate to daily readings or verse detail
      const currentDayReading = plan.dailyReadings[enrollment.currentDay - 1];
      if (currentDayReading && currentDayReading.passages.length > 0) {
        const passage = currentDayReading.passages[0];
        router.push({
          pathname: '/chapter-detail',
          params: {
            bookName: passage.book,
            chapterNumber: passage.chapter.toString(),
          },
        });
      }
    } catch (error) {
      console.error('Error starting reading:', error);
      Alert.alert('Error', 'Failed to start reading');
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Plan not found</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Plan Info */}
        <View style={styles.planInfo}>
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          <Text style={[styles.planDescription, { color: colors.secondaryText }]}>
            {plan.description}
          </Text>

          {/* Quick Stats */}
          <View style={[styles.statsContainer, { backgroundColor: colors.secondaryBackground }]}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-range" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{plan.duration}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Days</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="book" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{plan.testament}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Testament</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="chart-line" size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{plan.difficulty}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Level</Text>
            </View>
          </View>
        </View>

        {/* Enrollment Status and Progress */}
        {enrollment && stats ? (
          <>
            {/* Progress Section */}
            <View style={[styles.progressSection, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>

              <ProgressBar
                progress={stats.completionPercentage}
                height={10}
                backgroundColor={colors.border}
                progressColor={colors.primary}
                borderRadius={5}
                showLabel
                label={`${stats.completionPercentage}% Complete`}
                labelPosition="outside"
                labelStyle={{ color: colors.text }}
              />

              <View style={styles.progressDetails}>
                <View style={styles.progressDetail}>
                  <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
                    Current Day
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {enrollment.currentDay}/{plan.duration}
                  </Text>
                </View>
                <View style={styles.progressDetail}>
                  <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
                    Streak
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>
                    🔥 {stats.currentStreak}
                  </Text>
                </View>
                <View style={styles.progressDetail}>
                  <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
                    Days Late
                  </Text>
                  <Text style={[styles.progressValue, { color: stats.daysLate > 0 ? '#ef4444' : colors.text }]}>
                    {stats.daysLate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Start Reading Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleStartReading}
            >
              <MaterialCommunityIcons name="play" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Continue Reading Day {enrollment.currentDay}</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Enroll Button */
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEnroll}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Start This Plan</Text>
          </TouchableOpacity>
        )}

        {/* Daily Readings List */}
        <View style={styles.readingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Readings</Text>

          {plan.dailyReadings.slice(0, 5).map((day) => (
            <TouchableOpacity
              key={day.day}
              style={[styles.dayItem, { backgroundColor: colors.secondaryBackground }]}
              onPress={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayNumber}>
                  <Text style={[styles.dayNumberText, { color: colors.primary }]}>Day {day.day}</Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayTheme, { color: colors.text }]}>{day.theme || 'Reading'}</Text>
                  <Text style={[styles.dayPassages, { color: colors.secondaryText }]}>
                    {day.passages.length} passage{day.passages.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={expandedDay === day.day ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.secondaryText}
                />
              </View>

              {expandedDay === day.day && (
                <View style={styles.dayDetails}>
                  {day.passages.map((passage, idx) => (
                    <Text
                      key={idx}
                      style={[styles.passageText, { color: colors.secondaryText }]}
                    >
                      • {passage.book} {passage.chapter}
                      {passage.startVerse ? `:${passage.startVerse}` : ''}-
                      {passage.endVerse ? passage.endVerse : 'End'}
                    </Text>
                  ))}
                  {day.reflection && (
                    <View style={styles.reflectionContainer}>
                      <Text style={[styles.reflectionLabel, { color: colors.primary }]}>
                        💭 Reflection:
                      </Text>
                      <Text style={[styles.reflectionText, { color: colors.secondaryText }]}>
                        {day.reflection}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}

          {plan.dailyReadings.length > 5 && (
            <Text style={[styles.moreReadings, { color: colors.secondaryText }]}>
              + {plan.dailyReadings.length - 5} more days
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    paddingVertical: 16,
  },
  planInfo: {
    marginBottom: 24,
  },
  planName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressDetails: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-around',
  },
  progressDetail: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  readingsSection: {
    marginTop: 24,
  },
  dayItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayNumber: {
    width: 50,
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayInfo: {
    flex: 1,
  },
  dayTheme: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayPassages: {
    fontSize: 12,
  },
  dayDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  passageText: {
    fontSize: 13,
    marginBottom: 6,
  },
  reflectionContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reflectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  reflectionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  moreReadings: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});
