import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radii } from '../theme';

interface Props {
  text: string;
}

export function GnomeTip({ text }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#C41E3A" />
          <Text variant="labelMedium" style={styles.label}>Gnome Tip</Text>
        </View>
        <Text variant="bodySmall" style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    backgroundColor: '#C41E3A',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: '#C41E3A',
    fontWeight: '600',
  },
  text: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
});
