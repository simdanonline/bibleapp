import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';

interface SearchBarProps {
  onChangeText: (text: string) => void;
  placeholder?: string;
  value?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onChangeText, placeholder = 'Search...', value = '' }) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.tertiaryText} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.tertiaryText}
        onChangeText={onChangeText}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    height: 40,
    borderWidth: 1,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
});
