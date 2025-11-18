import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

interface NoteInputModalProps {
  visible: boolean;
  note?: Note;
  onSave: (data: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
  verseRef?: {
    book: string;
    chapter: number;
    verse: number;
    version: string;
  };
}

const NOTE_COLORS = ['#FFD700', '#90EE90', '#87CEEB', '#FFB6C1', '#DDA0DD'];

export const NoteInputModal: React.FC<NoteInputModalProps> = ({
  visible,
  note,
  onSave,
  onDelete,
  onCancel,
  verseRef,
}) => {
  const colors = useThemeColors();
  const [text, setText] = useState(note?.text || '');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [selectedColor, setSelectedColor] = useState(note?.color || '#FFD700');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Note cannot be empty');
      return;
    }

    if (text.length > 5000) {
      Alert.alert('Error', 'Note text exceeds 5000 character limit');
      return;
    }

    setLoading(true);
    try {
      if (note) {
        await onSave({
          text,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
          color: selectedColor,
          isPinned,
        } as UpdateNoteRequest);
      } else {
        if (!verseRef) throw new Error('Verse reference required for new note');
        await onSave({
          verseId: `${verseRef.version}:${verseRef.book}:${verseRef.chapter}:${verseRef.verse}`,
          book: verseRef.book,
          chapter: verseRef.chapter,
          verse: verseRef.verse,
          text,
          version: verseRef.version,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
          color: selectedColor,
        } as CreateNoteRequest);
      }
      setText('');
      setTags('');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            if (onDelete) {
              await onDelete();
            }
            onCancel();
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    verseRef: {
      fontSize: 12,
      color: colors.tertiaryText,
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      minHeight: 120,
      color: colors.text,
      backgroundColor: colors.secondaryBackground,
      marginBottom: 16,
      textAlignVertical: 'top',
    },
    section: {
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.tertiaryText,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    tagsInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.secondaryBackground,
    },
    colorPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pinButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pinButtonText: {
      marginLeft: 12,
      color: colors.text,
      fontSize: 16,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.secondaryBackground,
    },
    deleteButton: {
      backgroundColor: colors.accent,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    cancelButtonText: {
      color: colors.text,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modal}
      >
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{note ? 'Edit Note' : 'Add Note'}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {verseRef && (
            <Text style={styles.verseRef}>
              {verseRef.book} {verseRef.chapter}:{verseRef.verse}
            </Text>
          )}

          <TextInput
            style={styles.textInput}
            placeholder="Write your note..."
            placeholderTextColor={colors.tertiaryText}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={5000}
          />

          <Text style={{ color: colors.tertiaryText, fontSize: 12, marginBottom: 16 }}>
            {text.length} / 5000
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tags (optional)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="prayer, study, theology..."
              placeholderTextColor={colors.tertiaryText}
              value={tags}
              onChangeText={setTags}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Color</Text>
            <View style={styles.colorPicker}>
              {NOTE_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && { borderColor: colors.text },
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <MaterialCommunityIcons name="check" size={24} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {note && (
            <TouchableOpacity style={styles.pinButton} onPress={() => setIsPinned(!isPinned)}>
              <MaterialCommunityIcons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.pinButtonText}>{isPinned ? 'Pinned' : 'Pin this note'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, loading && styles.disabledButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check" size={20} color="white" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>

            {note && onDelete && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton, loading && styles.disabledButton]}
                onPress={handleDelete}
                disabled={loading}
              >
                <MaterialCommunityIcons name="delete" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
