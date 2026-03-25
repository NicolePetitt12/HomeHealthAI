import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { GnomeAvatar } from '../../components';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <GnomeAvatar state="idle" size={120} />
        <Text variant="headlineMedium" style={styles.title}>
          Welcome to Inspector Gnome
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your AI-powered home health assistant. Detect mold and moisture issues
          before they become costly problems.
        </Text>
      </View>
      <Button
        mode="contained"
        buttonColor="#2E7D32"
        onPress={() => navigation.navigate('Features')}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Get Started
      </Button>
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
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
