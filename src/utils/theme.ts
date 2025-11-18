import { useColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export const COLORS = {
  light: {
    background: '#fff',
    secondaryBackground: '#f8fafc',
    text: '#1e293b',
    secondaryText: '#64748b',
    tertiaryText: '#94a3b8',
    border: '#e2e8f0',
    primary: '#6366f1',
    accent: '#ef4444',
  },
  dark: {
    background: '#0f172a',
    secondaryBackground: '#1e293b',
    text: '#f1f5f9',
    secondaryText: '#cbd5e1',
    tertiaryText: '#94a3b8',
    border: '#334155',
    primary: '#818cf8',
    accent: '#f87171',
  },
};

export const getThemeColors = (colorScheme: ColorScheme | null | undefined) => {
  return COLORS[colorScheme === 'dark' ? 'dark' : 'light'];
};

export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  return getThemeColors(colorScheme);
};
