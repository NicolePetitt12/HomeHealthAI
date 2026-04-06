import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radii } from '../theme';

interface Props {
  steps: string[];
}

export function NextStepsPanel({ steps }: Props) {
  return (
    <View style={styles.card}>
      {steps.map((step, index) => (
        <View key={index} style={styles.row}>
          <MaterialCommunityIcons
            name="checkbox-marked-circle-outline"
            size={18}
            color="#2E7D32"
            style={styles.icon}
          />
          <Text variant="bodySmall" style={styles.text}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    color: '#E0E0E0',
    lineHeight: 18,
  },
});
