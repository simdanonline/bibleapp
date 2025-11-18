import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useBible } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';
import { SearchBar } from '../components/SearchBar';
import { NoteCard } from '../components/NoteCard';
import { Note, UpdateNoteRequest } from '../types';
import { NoteInputModal } from '../components/NoteInputModal';

export const NotesLibraryScreen: React.FC = () => {
  const colors = useThemeColors();
  const { notes, deleteNote, updateNote } = useBible();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filterNotes = React.useCallback(async (query: string) => {
    setLoading(true);
    try {
      if (!query.trim()) {
        // Sort by pinned first, then by updatedAt
        const sorted = [...notes].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setFilteredNotes(sorted);
      } else {
        const results = notes.filter(n => {
          const text = n.text.toLowerCase();
          const tags = (n.tags || []).join(' ').toLowerCase();
          return text.includes(query.toLowerCase()) || tags.includes(query.toLowerCase());
        });
        setFilteredNotes(results);
      }
    } finally {
      setLoading(false);
    }
  }, [notes]);

  useEffect(() => {
    filterNotes(searchQuery);
  }, [notes, searchQuery, filterNotes]);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
  };

  const handleUpdateNote = async (updates: UpdateNoteRequest) => {
    if (editingNote) {
      await updateNote(editingNote.id, updates);
      setEditingNote(null);
      setShowModal(false);
    }
  };

  const handleDeleteModal = async () => {
    if (editingNote) {
      await deleteNote(editingNote.id);
      setEditingNote(null);
      setShowModal(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    stats: {
      fontSize: 14,
      color: colors.tertiaryText,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.tertiaryText,
      textAlign: 'center',
    },
  });

  const renderItem = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={() => handleEditNote(item)}
      onEdit={() => handleEditNote(item)}
      onDelete={() => handleDeleteNote(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.stats}>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No notes match "${searchQuery}"`
                : 'No notes yet. Tap a note icon on any verse to get started!'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            scrollEnabled={true}
          />
        )}
      </View>

      <NoteInputModal
        visible={showModal}
        note={editingNote || undefined}
        onSave={handleUpdateNote}
        onDelete={editingNote ? handleDeleteModal : undefined}
        onCancel={() => {
          setShowModal(false);
          setEditingNote(null);
        }}
      />
    </SafeAreaView>
  );
};
