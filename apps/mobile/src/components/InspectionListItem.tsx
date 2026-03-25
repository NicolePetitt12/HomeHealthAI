import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import type { RiskLevel } from '@inspector-gnome/shared';
import { RiskDot } from './RiskDot';
import { RiskBadge } from './RiskBadge';
import { spacing, radii } from '../theme';

interface Props {
  location: string;
  date: string;
  riskLevel: RiskLevel;
  status: string;
  onPress?: () => void;
  showViewDetails?: boolean;
}

export function InspectionListItem({ location, date, riskLevel, status, onPress, showViewDetails }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.dotCol}>
        <RiskDot level={riskLevel} size={12} />
      </View>
      <View style={styles.info}>
        <Text variant="titleSmall" style={styles.location}>{location}</Text>
        <Text variant="bodySmall" style={styles.meta}>{date}</Text>
        <Text variant="labelSmall" style={styles.status}>{status}</Text>
      </View>
      <View style={styles.right}>
        <RiskBadge level={riskLevel} />
        {showViewDetails && (
          <Text variant="labelSmall" style={styles.viewDetails}>View Details</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  dotCol: {
    paddingTop: 4,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  location: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  meta: {
    color: '#B0B0B0',
  },
  status: {
    color: '#888888',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  viewDetails: {
    color: '#2E7D32',
    marginTop: spacing.xs,
  },
});
