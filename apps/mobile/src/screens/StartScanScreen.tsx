import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../components';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'StartScan'>;

export function StartScanScreen({ navigation, route }: Props) {
  const prefillLocation = route.params?.prefillLocation;
  const prefillNotes = route.params?.prefillNotes;

  function handleCamera() {
    navigation.navigate('Camera');
  }

  async function handleUpload() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Inspector Gnome needs access to your photos to upload images.',
        [{ text: 'OK' }],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.replace('PhotoReview', { imageUri: result.assets[0].uri, source: 'gallery', prefillLocation, prefillNotes });
    }
  }

  return (
    <ScreenContainer>
      {/* Image placeholder — same area as HeroCard */}
      <LinearGradient
        colors={['#1A1A1A', '#111111']}
        style={styles.imagePlaceholder}
      >
        <MaterialCommunityIcons name="image-area" size={48} color="#3A3A3A" />
        <Text variant="bodySmall" style={styles.placeholderText}>Photo preview</Text>
      </LinearGradient>

      {/* Instructions */}
      <Text variant="bodyMedium" style={styles.instructions}>
        Capture or upload a photo of the affected area to get started.
      </Text>

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
  imagePlaceholder: {
    borderRadius: radii.xl,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#3A3A3A',
  },
  instructions: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
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
