import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ResumeCardData } from '../types';
import { useThemeColors } from '../utils/theme';

interface ResumeReadingCardProps {
  data: ResumeCardData | null;
  onResume: (book: string, chapter: number, scrollPosition: number) => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

/**
 * Resume card component displayed on Home screen
 * Shows last reading session and allows user to resume from where they left off
 */
export const ResumeReadingCard: React.FC<ResumeReadingCardProps> = React.memo(
  ({ data, onResume, isLoading = false, style }) => {
    const colors = useThemeColors();

    if (!data) {
      return (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.secondaryBackground },
            style,
          ]}
        >
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={24}
            color={colors.tertiaryText}
          />
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
            Start reading to resume later
          </Text>
        </View>
      );
    }

    const handleResume = () => {
      onResume(data.book, data.chapter, data.scrollPosition);
    };

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.secondaryBackground },
          style,
        ]}
        onPress={handleResume}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        {/* Header row: Title and time */}
        <View style={styles.cardHeader}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>
              Continue Reading
            </Text>
            <Text style={[styles.bookChapter, { color: colors.primary }]}>
              {data.book} {data.chapter}
            </Text>
          </View>
          <Text style={[styles.timeAgo, { color: colors.tertiaryText }]}>
            {data.formattedTime}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${data.scrollPercentage}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.tertiaryText }]}>
            {Math.round(data.scrollPercentage)}% through
          </Text>
        </View>

        {/* Optional preview text */}
        {data.preview && (
          <Text
            numberOfLines={2}
            style={[styles.preview, { color: colors.secondaryText }]}
          >
            {data.preview}
          </Text>
        )}

        {/* Footer with bookmark icon and action hint */}
        <View style={styles.cardFooter}>
          <MaterialCommunityIcons
            name="bookmark"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.resumeHint, { color: colors.tertiaryText }]}>
            Tap to resume reading
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

ResumeReadingCard.displayName = 'ResumeReadingCard';

const styles = StyleSheet.create({
  emptyCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookChapter: {
    fontSize: 16,
    fontWeight: '700',
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  resumeHint: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
});
