import { MD3DarkTheme, useTheme } from 'react-native-paper';
import type { RiskLevel } from '@inspector-gnome/shared';

// ─── Color Palette ───────────────────────────────────────────────────────────

const colors = {
  background: '#0D0807',
  surface: '#1C1212',
  surfaceVariant: '#2A1A1A',
  primary: '#C41E3A',
  primaryContainer: '#7F0000',
  secondary: '#E53935',
  secondaryContainer: '#8B0000',
  onBackground: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#B0A0A0',
  outline: '#3A2020',
  error: '#FF6B6B',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onError: '#FFFFFF',
  elevation: {
    level0: 'transparent',
    level1: '#1C1212',
    level2: '#231515',
    level3: '#271717',
    level4: '#281818',
    level5: '#2C1A1A',
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
