import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RiskLevel } from '@inspector-gnome/shared';
import { riskColors, radii, spacing } from '../theme';

interface Props {
  level: RiskLevel;
}

const labels: Record<RiskLevel, string> = {
  high: 'High',
  moderate: 'Moderate',
  low: 'Low',
};

export function RiskBadge({ level }: Props) {
  const c = riskColors[level];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{labels[level]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
