import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { RiskLevel } from '@inspector-gnome/shared';
import { riskColors } from '../theme';

interface Props {
  level: RiskLevel;
  size?: number;
}

export function RiskDot({ level, size = 10 }: Props) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: riskColors[level].dot },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {},
});
