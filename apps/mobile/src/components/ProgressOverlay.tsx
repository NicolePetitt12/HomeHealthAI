import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { GnomeAvatar } from './GnomeAvatar';
import type { SubmitStage } from '../hooks/useSubmitScan';

interface Props {
  visible: boolean;
  stage: SubmitStage;
  percent: number;
}

const stageLabels: Record<SubmitStage, string> = {
  compressing: 'Compressing image...',
  uploading: 'Uploading to cloud...',
  creating: 'Creating inspection...',
  done: 'All done!',
};

export function ProgressOverlay({ visible, stage, percent }: Props) {
  if (!visible) return null;

  const clampedPct = Math.max(0, Math.min(100, percent));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-only">
      <View style={styles.backdrop}>
        <GnomeAvatar state="analyzing" size={100} />
        <Text variant="titleMedium" style={styles.label}>{stageLabels[stage]}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clampedPct}%` }]} />
        </View>
        <Text variant="labelSmall" style={styles.pct}>{clampedPct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  label: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 3,
  },
  pct: {
    color: '#B0B0B0',
  },
});
