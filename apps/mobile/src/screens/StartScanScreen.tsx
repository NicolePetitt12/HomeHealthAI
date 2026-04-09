import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer, WelcomeCard, useDialog } from '../components';
import { spacing, radii } from '../theme';
import { useQuotaGate } from '../hooks/useQuotaGate';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'StartScan'>;

export function StartScanScreen({ navigation, route }: Props) {
  const prefillLocation = route.params?.prefillLocation;
  const prefillNotes = route.params?.prefillNotes;
  const checkQuota = useQuotaGate();
  const { showDialog } = useDialog();

  function handleCamera() {
    checkQuota(() => navigation.navigate('Camera'));
  }

  async function handleUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showDialog({
        title: 'Permission Required',
        message: 'Inspector Gnome needs access to your photos to upload images.',
      });
      return;
    }
    checkQuota(async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        navigation.replace('PhotoReview', { imageUri: result.assets[0].uri, source: 'gallery', prefillLocation, prefillNotes });
      }
    });
  }

  return (
    <ScreenContainer>
      <WelcomeCard
        title="New Inspection"
        subtitle="Take or upload a photo of the area you'd like to inspect."
        gnomeState="analyzing"
      />

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={handleCamera} activeOpacity={0.85}>
          <View style={styles.btnIconWrap}>
            <MaterialCommunityIcons name="camera" size={32} color="#FFFFFF" />
          </View>
          <Text variant="labelLarge" style={styles.btnLabel}>Take Photo</Text>
          <Text variant="bodySmall" style={styles.btnSub}>Use your camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleUpload} activeOpacity={0.85}>
          <View style={styles.btnIconWrap}>
            <MaterialCommunityIcons name="image-multiple" size={32} color="#FFFFFF" />
          </View>
          <Text variant="labelLarge" style={styles.btnLabel}>Upload</Text>
          <Text variant="bodySmall" style={styles.btnSub}>From your gallery</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#3A2020',
  },
  btnIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C41E3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnSub: {
    color: '#888888',
  },
});
