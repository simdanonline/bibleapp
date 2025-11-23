import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { HighlightColor } from '../types';

interface HighlightIndicatorProps {
  color: HighlightColor;
  onPress?: () => void;
}

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#FFF59D',
  green: '#C8E6C9',
  blue: '#BBDEFB',
  pink: '#F8BBD0',
  purple: '#E1BEE7',
  orange: '#FFE0B2',
};

export const HighlightIndicator: React.FC<HighlightIndicatorProps> = ({
  color,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.indicator,
        { backgroundColor: HIGHLIGHT_COLORS[color] },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 8,
  },
});
