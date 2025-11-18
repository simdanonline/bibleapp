import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BibleProvider } from './src/context/BibleContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { BooksScreen } from './src/screens/BooksScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { ChaptersScreen } from './src/screens/ChaptersScreen';
import { ChapterDetailScreen } from './src/screens/ChapterDetailScreen';

const Stack = createNativeStackNavigator<any>();
const Tab = createBottomTabNavigator<any>();
const BooksStack = createNativeStackNavigator<any>();
const SearchStack = createNativeStackNavigator<any>();

const BooksStackNavigator = () => (
  <BooksStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <BooksStack.Screen name="BooksList" component={BooksScreen as any} />
    <BooksStack.Screen name="Chapters" component={ChaptersScreen as any} />
    <BooksStack.Screen name="ChapterDetail" component={ChapterDetailScreen as any} />
  </BooksStack.Navigator>
);

const SearchStackNavigator = () => (
  <SearchStack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <SearchStack.Screen name="SearchTab" component={SearchScreen} />
    <SearchStack.Screen name="ChapterDetail" component={ChapterDetailScreen as any} />
  </SearchStack.Navigator>
);

const BottomTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color }) => {
        let iconName: any = 'home';

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Books') {
          iconName = focused ? 'book' : 'book-outline';
        } else if (route.name === 'Search') {
          iconName = 'magnify';
        } else if (route.name === 'Library') {
          iconName = focused ? 'library' : 'library-shelves';
        }

        return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
      },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'Home',
      }}
    />
    <Tab.Screen
      name="Books"
      component={BooksStackNavigator}
      options={{
        title: 'Books',
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchStackNavigator}
      options={{
        title: 'Search',
      }}
    />
    <Tab.Screen
      name="Library"
      component={LibraryScreen}
      options={{
        title: 'Library',
      }}
    />
  </Tab.Navigator>
);

export default function App() {
  return (
    <BibleProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Main" component={BottomTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </BibleProvider>
  );
}
