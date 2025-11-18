import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { BibleBook } from '../types';
import { BookList } from '../components/BookList';
import bibleService from '../services/bibleService';
import { useThemeColors } from '../utils/theme';

type RootStackParamList = {
  BooksDetail: {
    testament: 'Old' | 'New';
  };
};

type BooksDetailRouteProp = RouteProp<RootStackParamList, 'BooksDetail'>;

interface BooksDetailScreenProps {
  route: BooksDetailRouteProp;
  navigation: any;
}

export const BooksDetailScreen: React.FC<BooksDetailScreenProps> = ({ route, navigation }) => {
  const { testament } = route.params;
  const colors = useThemeColors();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, [testament]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const allBooks = await bibleService.getBooks();
      const filteredBooks = allBooks.filter((book) => book.testament === testament);
      setBooks(filteredBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (book: BibleBook) => {
    navigation.navigate('Chapters', {
      bookName: book.name,
      bookId: book.id,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{testament} Testament</Text>
      <BookList books={books} onSelectBook={handleSelectBook} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
