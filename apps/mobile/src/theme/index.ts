import { MD3DarkTheme, useTheme } from 'react-native-paper';
import type { RiskLevel } from '@inspector-gnome/shared';

// ─── Color Palette ───────────────────────────────────────────────────────────

const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  primary: '#2E7D32',
  primaryContainer: '#1B5E20',
  secondary: '#558B2F',
  secondaryContainer: '#33691E',
  onBackground: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#B0B0B0',
  outline: '#3A3A3A',
  error: '#CF6679',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF',
  elevation: {
    level0: 'transparent',
    level1: '#1E1E1E',
    level2: '#242424',
    level3: '#272727',
    level4: '#282828',
    level5: '#2C2C2C',
  },
};

// ─── Risk Level Colors ───────────────────────────────────────────────────────

export const riskColors: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  high:     { bg: '#4A1C1C', text: '#FF6B6B', dot: '#FF4444' },
  moderate: { bg: '#4A3A1C', text: '#FFB74D', dot: '#FFA726' },
  low:      { bg: '#1C3A1C', text: '#81C784', dot: '#4CAF50' },
};

// ─── Spacing Scale ───────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border Radii ────────────────────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Theme ───────────────────────────────────────────────────────────────────

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...colors,
  },
};

export type AppTheme = typeof theme;

export const useAppTheme = () => useTheme<AppTheme>();
