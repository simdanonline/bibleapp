import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { HighlightColor } from '../types';

interface HighlightColorPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSelectColor: (color: HighlightColor) => void;
  currentColor?: HighlightColor;
}

const HIGHLIGHT_COLORS: { name: HighlightColor; hex: string; label: string }[] = [
  { name: 'yellow', hex: '#FFF59D', label: 'Yellow' },
  { name: 'green', hex: '#C8E6C9', label: 'Green' },
  { name: 'blue', hex: '#BBDEFB', label: 'Blue' },
  { name: 'pink', hex: '#F8BBD0', label: 'Pink' },
  { name: 'purple', hex: '#E1BEE7', label: 'Purple' },
  { name: 'orange', hex: '#FFE0B2', label: 'Orange' },
];

export const HighlightColorPickerModal: React.FC<HighlightColorPickerModalProps> = ({
  visible,
  onDismiss,
  onSelectColor,
  currentColor,
}) => {
  const [selectedColor, setSelectedColor] = useState<HighlightColor | undefined>(currentColor);

  const handleColorSelect = (color: HighlightColor) => {
    setSelectedColor(color);
    onSelectColor(color);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Select Highlight Color</Text>

          <ScrollView style={styles.colorGrid}>
            {HIGHLIGHT_COLORS.map((color) => (
              <TouchableOpacity
                key={color.name}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.hex },
                  selectedColor === color.name && styles.selectedColorButton,
                ]}
                onPress={() => handleColorSelect(color.name)}
              >
                <View style={styles.colorButtonContent}>
                  <Text style={styles.colorLabel}>{color.label}</Text>
                  {selectedColor === color.name && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onDismiss}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorGrid: {
    marginBottom: 20,
  },
  colorButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorButton: {
    borderColor: '#6366f1',
  },
  colorButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#333',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
