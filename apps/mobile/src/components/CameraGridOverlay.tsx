import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface Props {
  showDistancePrompt?: boolean;
}

export function CameraGridOverlay({ showDistancePrompt = true }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rule-of-thirds grid lines */}
      <View style={[styles.line, styles.hLine, { top: '33%' }]} />
      <View style={[styles.line, styles.hLine, { top: '66%' }]} />
      <View style={[styles.line, styles.vLine, { left: '33%' }]} />
      <View style={[styles.line, styles.vLine, { left: '66%' }]} />

      {/* Distance prompt */}
      {showDistancePrompt && (
        <View style={styles.promptContainer}>
          <View style={styles.promptPill}>
            <Text style={styles.promptText}>Hold 12–18 inches from area</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const LINE_COLOR = 'rgba(255,255,255,0.25)';

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    backgroundColor: LINE_COLOR,
  },
  hLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  vLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  promptContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  promptPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  promptText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
});
