import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { GnomeAvatar } from '../../components';
import { spacing } from '../../theme';

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
        <GnomeAvatar state="analyzing" size={110} />
        <Text variant="headlineMedium" style={styles.title}>Camera Access</Text>
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
            buttonColor="#2E7D32"
            onPress={handleAllow}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Allow Camera Access
          </Button>
        )}
        <Button
          mode={granted ? 'contained' : 'outlined'}
          buttonColor={granted ? '#2E7D32' : undefined}
          textColor={granted ? '#FFFFFF' : '#2E7D32'}
          onPress={finish}
          style={[styles.button, !granted && styles.outlinedButton]}
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
    backgroundColor: '#121212',
    padding: spacing.xxxl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
  },
  granted: {
    color: '#81C784',
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
  outlinedButton: {
    borderColor: '#2E7D32',
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
