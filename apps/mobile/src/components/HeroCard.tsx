import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radii } from '../theme';

interface Props {
  title: string;
  subtitle: string;
}

export function HeroCard({ title, subtitle }: Props) {
  return (
    <LinearGradient
      colors={['#1B5E20', '#2E7D32', '#388E3C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconRow}>
        <MaterialCommunityIcons name="shield-home" size={48} color="rgba(255,255,255,0.9)" />
      </View>
      <Text variant="headlineSmall" style={styles.title}>{title}</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconRow: {
    marginBottom: spacing.xs,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
