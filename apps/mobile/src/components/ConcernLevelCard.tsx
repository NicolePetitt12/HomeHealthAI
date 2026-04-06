import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { RiskBadge } from './RiskBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { riskColors, spacing, radii } from '../theme';
import type { RiskLevel } from '@inspector-gnome/shared';

interface Props {
  riskLevel: RiskLevel;
  /** 0-100 for display */
  confidence: number;
}

export function ConcernLevelCard({ riskLevel, confidence }: Props) {
  const colors = riskColors[riskLevel];
  return (
    <View style={[styles.card, { backgroundColor: colors.bg }]}>
      <View style={styles.row}>
        <RiskBadge level={riskLevel} />
        <Text variant="headlineSmall" style={[styles.pct, { color: colors.text }]}>
          {confidence}%
        </Text>
      </View>
      <ConfidenceBar percentage={confidence} label="Analysis Confidence" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pct: {
    fontWeight: '700',
  },
});
