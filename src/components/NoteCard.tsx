import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onEdit, onDelete }) => {
  const colors = useThemeColors();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: note.color || colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    verse: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    pin: {
      color: colors.accent,
    },
    text: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: 12,
      color: colors.tertiaryText,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      padding: 4,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.verse}>
          {note.book} {note.chapter}:{note.verse}
        </Text>
        {note.isPinned && <MaterialCommunityIcons name="pin" size={16} style={styles.pin} />}
      </View>

      <Text style={styles.text} numberOfLines={2}>
        {note.text}
      </Text>

      {note.tags && note.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {note.tags.map((tag, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.accent + '20',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 11 }}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
        {(onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.button} onPress={onEdit}>
                <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.button} onPress={onDelete}>
                <MaterialCommunityIcons name="delete" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
