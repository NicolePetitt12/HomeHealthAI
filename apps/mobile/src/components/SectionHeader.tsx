import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing } from '../theme';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text variant="titleMedium" style={styles.title}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text variant="labelMedium" style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  action: {
    color: '#C41E3A',
  },
});
