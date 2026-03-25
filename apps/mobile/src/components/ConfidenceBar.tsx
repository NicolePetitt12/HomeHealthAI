import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { spacing } from '../theme';

interface Props {
  percentage: number;
  label?: string;
}

export function ConfidenceBar({ percentage, label = 'Analysis Confidence' }: Props) {
  const value = Math.max(0, Math.min(100, percentage)) / 100;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text variant="labelMedium" style={styles.label}>{label}</Text>
        <Text variant="labelMedium" style={styles.pct}>{Math.round(percentage)}% Match</Text>
      </View>
      <ProgressBar progress={value} color="#2E7D32" style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#B0B0B0',
  },
  pct: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
});
