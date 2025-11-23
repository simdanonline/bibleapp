import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  showLabel?: boolean;
  label?: string;
  labelPosition?: 'inside' | 'outside' | 'right';
  animated?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

/**
 * Reusable progress bar component for displaying reading progress
 * Optimized for performance with minimal re-renders
 */
export const ProgressBar: React.FC<ProgressBarProps> = React.memo(
  ({
    progress,
    height = 8,
    backgroundColor = '#E5E7EB',
    progressColor = '#6366F1',
    borderRadius = 4,
    showLabel = false,
    label,
    labelPosition = 'outside',
    style,
    containerStyle,
    labelStyle,
  }) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(progress, 100));

    const progressWidth = clampedProgress;

    const renderLabel = () => {
      if (!showLabel) return null;
      const displayLabel = label || `${Math.round(clampedProgress)}%`;
      return (
        <Text style={[styles.label, labelStyle]}>
          {displayLabel}
        </Text>
      );
    };

    if (labelPosition === 'outside') {
      return (
        <View style={[styles.outerContainer, containerStyle]}>
          <View style={[styles.container, { height, borderRadius }, style]}>
            <View
              style={[
                styles.progress,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: progressColor,
                  borderRadius,
                },
              ]}
            />
            <View
              style={[
                styles.background,
                {
                  backgroundColor,
                  borderRadius,
                },
              ]}
            />
          </View>
          {renderLabel()}
        </View>
      );
    }

    if (labelPosition === 'right') {
      return (
        <View style={[styles.rightLabelContainer, containerStyle]}>
          <View style={[styles.container, { height, borderRadius }, { flex: 1 }, style]}>
            <View
              style={[
                styles.progress,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: progressColor,
                  borderRadius,
                },
              ]}
            />
            <View
              style={[
                styles.background,
                {
                  backgroundColor,
                  borderRadius,
                },
              ]}
            />
          </View>
          {renderLabel()}
        </View>
      );
    }

    // labelPosition === 'inside'
    return (
      <View style={[styles.container, { height, borderRadius }, style]}>
        <View
          style={[
            styles.progress,
            {
              width: `${progressWidth}%`,
              backgroundColor: progressColor,
              borderRadius,
            },
          ]}
        />
        <View
          style={[
            styles.background,
            {
              backgroundColor,
              borderRadius,
            },
          ]}
        />
        {showLabel && (
          <View style={styles.insideLabel}>
            <Text style={[styles.insideLabelText, labelStyle]}>
              {label || `${Math.round(clampedProgress)}%`}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

const styles = StyleSheet.create({
  outerContainer: {
    gap: 4,
  },
  rightLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  background: {
    flex: 1,
  },
  insideLabel: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insideLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});
