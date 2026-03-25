import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GnomeAvatar } from '../components';
import { spacing } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'Camera'>;

export function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current || analyzing) return;
    setAnalyzing(true);
    try {
      await cameraRef.current.takePictureAsync({ quality: 0.8 });
      // Simulate analysis delay — will be replaced with real API call
      await new Promise((r) => setTimeout(r, 1500));
      navigation.replace('Results', { inspectionId: 'mock-id' });
    } finally {
      setAnalyzing(false);
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <GnomeAvatar state="idle" size={100} />
        <Text variant="titleMedium" style={styles.permText}>Camera access needed</Text>
        <Text variant="bodySmall" style={styles.permSub}>
          Inspector Gnome needs your camera to scan areas for mold and moisture.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text variant="labelLarge" style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Header — absolutely positioned over camera */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text variant="titleSmall" style={styles.topTitle}>New Inspection</Text>
        <View style={styles.closeBtn} />
      </View>

      {/* Analyzing overlay */}
      {analyzing && (
        <View style={styles.overlay}>
          <GnomeAvatar state="analyzing" size={100} />
          <Text variant="titleMedium" style={styles.analyzingText}>Analyzing...</Text>
        </View>
      )}

      {/* Capture controls — absolutely positioned over camera */}
      <View style={styles.bottomBar}>
        <Text variant="labelSmall" style={styles.hint}>
          Point at the area you want to inspect
        </Text>
        <TouchableOpacity
          style={[styles.captureBtn, analyzing && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={analyzing}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  analyzingText: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  hint: {
    color: 'rgba(255,255,255,0.7)',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  permText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permSub: {
    color: '#B0B0B0',
    textAlign: 'center',
  },
  permBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  permBtnText: {
    color: '#FFFFFF',
  },
});
