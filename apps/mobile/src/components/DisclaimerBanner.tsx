import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radii } from '../theme';

const DEFAULT_TEXT =
  'This analysis is informational only and does not constitute a professional inspection. We recommend having a qualified professional evaluate any concerns.';

interface Props {
  text?: string;
}

export function DisclaimerBanner({ text = DEFAULT_TEXT }: Props) {
  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="information-outline" size={16} color="#888888" style={styles.icon} />
      <Text variant="bodySmall" style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    color: '#888888',
    lineHeight: 17,
  },
});
