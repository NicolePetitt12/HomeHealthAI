import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboarding } from '../../contexts/OnboardingContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Permissions'>;

export function PermissionsScreen(_: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const { completeOnboarding } = useOnboarding();

  async function handleAllow() {
    await requestPermission();
    await completeOnboarding();
  }

  async function finish() {
    await completeOnboarding();
  }

  const granted = permission?.granted ?? false;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📷</Text>
        <Text variant="headlineMedium" style={styles.title}>
          Camera Access
        </Text>
        <Text variant="bodyLarge" style={styles.body}>
          Inspector Gnome needs access to your camera to photograph areas you want
          analyzed. Your photos are processed securely and never shared without your
          permission.
        </Text>
        {granted && (
          <Text variant="bodyMedium" style={styles.granted}>
            ✅ Camera access granted
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {!granted && (
          <Button
            mode="contained"
            onPress={handleAllow}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Allow Camera Access
          </Button>
        )}
        <Button
          mode={granted ? 'contained' : 'outlined'}
          onPress={finish}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {granted ? 'Continue' : 'Skip for Now'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  body: {
    textAlign: 'center',
    opacity: 0.7,
  },
  granted: {
    color: '#2E7D32',
  },
  actions: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
