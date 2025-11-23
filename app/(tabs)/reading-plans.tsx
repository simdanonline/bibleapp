import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ReadingPlanMetadata, ReadingPlanEnrollment } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';
import readingPlanService from '@/src/services/readingPlanService';
import { ReadingPlanCard } from '@/src/components/ReadingPlanCard';

export default function ReadingPlansScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [plans, setPlans] = useState<ReadingPlanMetadata[]>([]);
  const [enrollments, setEnrollments] = useState<ReadingPlanEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, enrollmentsData] = await Promise.all([
        readingPlanService.loadReadingPlans(),
        readingPlanService.getUserEnrollments(),
      ]);
      setPlans(plansData);
      setEnrollments(enrollmentsData.filter(e => e.status === 'active'));
    } catch (error) {
      console.error('Error loading reading plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handlePlanPress = (plan: ReadingPlanMetadata) => {
    router.push({
      pathname: '/plan-detail' as any,
      params: {
        planId: plan.id,
      },
    });
  };

  const isEnrolled = (planId: string) => {
    return enrollments.some(e => e.planId === planId);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.text }]}>Reading Plans</Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        Choose a plan and start your journey
      </Text>
      {enrollments.length > 0 && (
        <View style={[styles.activeCount, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.activeCountText, { color: colors.primary }]}>
            {enrollments.length} active {enrollments.length === 1 ? 'plan' : 'plans'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
        No reading plans available
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        contentContainerStyle={styles.container}
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReadingPlanCard
            plan={item}
            onPress={handlePlanPress}
            isEnrolled={isEnrolled(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
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
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  activeCount: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  activeCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
