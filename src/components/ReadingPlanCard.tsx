import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReadingPlanMetadata } from '@/src/types';
import { useThemeColors } from '@/src/utils/theme';

interface ReadingPlanCardProps {
  plan: ReadingPlanMetadata;
  onPress: (plan: ReadingPlanMetadata) => void;
  isEnrolled?: boolean;
}

export const ReadingPlanCard: React.FC<ReadingPlanCardProps> = ({ plan, onPress, isEnrolled }) => {
  const colors = useThemeColors();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#10b981';
      case 'Moderate':
        return '#f59e0b';
      case 'Advanced':
        return '#ef4444';
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.secondaryBackground }]}
      onPress={() => onPress(plan)}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleSection}>
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-range" size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>{plan.duration} days</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="book" size={14} color={colors.secondaryText} />
              <Text style={[styles.metaText, { color: colors.secondaryText }]}>{plan.testament}</Text>
            </View>
          </View>
        </View>
        {isEnrolled && (
          <View style={[styles.enrolledBadge, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="check" size={16} color="white" />
          </View>
        )}
      </View>

      <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
        {plan.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(plan.difficulty) + '20' }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(plan.difficulty) }]}>
            {plan.difficulty}
          </Text>
        </View>
        <View style={styles.tagsContainer}>
          {plan.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.secondaryText }]}>{tag}</Text>
            </View>
          ))}
          {plan.tags.length > 2 && (
            <Text style={[styles.moreText, { color: colors.secondaryText }]}>+{plan.tags.length - 2}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  enrolledBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginLeft: 12,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  moreText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
