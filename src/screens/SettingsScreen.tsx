import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBible, BibleVersion } from '../context/BibleContext';
import { useThemeColors } from '../utils/theme';

export const SettingsScreen: React.FC = () => {
  const { currentVersion, availableVersions, setCurrentVersion } = useBible();
  const colors = useThemeColors();

  const handleVersionSelect = async (versionId: string) => {
    await setCurrentVersion(versionId);
  };

  // Group versions by category
  const versionsByCategory = availableVersions.reduce((acc, version) => {
    if (!acc[version.category]) {
      acc[version.category] = [];
    }
    acc[version.category].push(version);
    return acc;
  }, {} as Record<string, BibleVersion[]>);

  const categoryOrder = ['Classic', 'Literal', 'Scholarly', 'Balanced', 'Modern', 'Readability', 'Detailed'];
  const sortedCategories = categoryOrder.filter((cat) => versionsByCategory[cat]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Bible Versions</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Select your preferred Bible translation</Text>

        {sortedCategories.map((category) => (
          <View key={category}>
            <Text style={[styles.categoryTitle, { color: colors.primary }]}>{category}</Text>
            {versionsByCategory[category].map((version) => (
              <TouchableOpacity
                key={version.id}
                style={[
                  styles.versionItem,
                  { backgroundColor: colors.secondaryBackground, borderColor: colors.border },
                  currentVersion === version.id && { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
                ]}
                onPress={() => handleVersionSelect(version.id)}
              >
                <View style={styles.versionContent}>
                  <Text style={[styles.versionName, { color: colors.text }]}>{version.name}</Text>
                  <Text style={[styles.versionId, { color: colors.tertiaryText }]}>{version.id}</Text>
                </View>
                {currentVersion === version.id && (
                  <MaterialIcons name="check" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={[styles.infoSection, { backgroundColor: colors.secondaryBackground, borderLeftColor: colors.primary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Bible Versions</Text>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Classic:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Traditional word-for-word translations</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Literal:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Direct, precise word-for-word translations</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Scholarly:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Academic, detailed translations with study notes</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Balanced:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Balance between word-for-word and meaning-for-meaning</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Modern:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Contemporary language, easy to read</Text>
          </View>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryInfoLabel, { color: colors.text }]}>Readability:</Text>
            <Text style={[styles.categoryInfoText, { color: colors.secondaryText }]}>Emphasis on easy understanding and flow</Text>
          </View>
        </View>

        <View style={[styles.statsSection, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Currently Loaded</Text>
          <Text style={[styles.statsText, { color: colors.primary }]}>{availableVersions.length} translations available</Text>
          <Text style={[styles.statsSmall, { color: colors.secondaryText }]}>All versions are stored locally for offline reading</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  versionContent: {
    flex: 1,
  },
  versionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionId: {
    fontSize: 12,
  },
  infoSection: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryInfo: {
    marginBottom: 12,
  },
  categoryInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryInfoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  statsSection: {
    marginTop: 24,
    marginBottom: 32,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  statsSmall: {
    fontSize: 12,
  },
});
