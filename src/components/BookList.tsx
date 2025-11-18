import React from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { BibleBook } from '../types';

interface BookListProps {
  books: BibleBook[];
  onSelectBook: (book: BibleBook) => void;
  filterTerm?: string;
}

export const BookList: React.FC<BookListProps> = ({ books, onSelectBook, filterTerm = '' }) => {
  const filteredBooks = books.filter((book) =>
    book.name.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const renderBook = ({ item }: { item: BibleBook }) => (
    <TouchableOpacity style={styles.bookItem} onPress={() => onSelectBook(item)}>
      <View style={styles.bookContent}>
        <Text style={styles.bookName}>{item.name}</Text>
        <Text style={styles.chapterCount}>{item.chapters} chapters</Text>
      </View>
      <View style={[styles.badge, item.testament === 'Old' ? styles.oldTestament : styles.newTestament]}>
        <Text style={styles.badgeText}>{item.testament}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={filteredBooks}
      renderItem={renderBook}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bookContent: {
    flex: 1,
  },
  bookName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  chapterCount: {
    fontSize: 12,
    color: '#64748b',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  oldTestament: {
    backgroundColor: '#fce7f3',
  },
  newTestament: {
    backgroundColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});
