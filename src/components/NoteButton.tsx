import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';

interface NoteButtonProps {
  hasNote: boolean;
  onPress: () => void;
  size?: number;
}

export const NoteButton: React.FC<NoteButtonProps> = ({ hasNote, onPress, size = 24 }) => {
  const colors = useThemeColors();

  return (
    <TouchableOpacity onPress={onPress}>
      <MaterialCommunityIcons
        name={hasNote ? 'note-check' : 'note-outline'}
        size={size}
        color={hasNote ? colors.primary : colors.tertiaryText}
      />
    </TouchableOpacity>
  );
};
