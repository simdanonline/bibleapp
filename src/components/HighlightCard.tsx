import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Highlight } from '../types';
import { useThemeColors } from '../utils/theme';

interface HighlightCardProps {
  highlight: Highlight;
  onDelete?: () => void;
  onChangeColor?: () => void;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: '#FFF59D',
  green: '#C8E6C9',
  blue: '#BBDEFB',
  pink: '#F8BBD0',
  purple: '#E1BEE7',
  orange: '#FFE0B2',
};

export const HighlightCard: React.FC<HighlightCardProps> = ({
  highlight,
  onDelete,
  onChangeColor,
}) => {
  const colors = useThemeColors();
  const colorHex = HIGHLIGHT_COLORS[highlight.color] || '#FFF59D';

  return (
    <View style={[styles.container, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
      <View style={[styles.colorBar, { backgroundColor: colorHex }]} />
      
      <View style={styles.content}>
        <Text style={[styles.verseRef, { color: colors.primary }]}>
          {highlight.book} {highlight.chapter}:{highlight.verse}
        </Text>
        
        <Text style={[styles.verseText, { color: colors.text }]} numberOfLines={3}>
          {highlight.text}
        </Text>
        
        <View style={styles.metadata}>
          <View style={styles.colorTag}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: colorHex },
              ]}
            />
            <Text style={[styles.colorLabel, { color: colors.tertiaryText }]}>
              {highlight.color}
            </Text>
          </View>
          
          <Text style={[styles.timestamp, { color: colors.tertiaryText }]}>
            {new Date(highlight.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onChangeColor} style={styles.actionButton}>
          <MaterialCommunityIcons
            name="pencil"
            size={18}
            color={colors.primary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={colors.accent}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  verseRef: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  verseText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
