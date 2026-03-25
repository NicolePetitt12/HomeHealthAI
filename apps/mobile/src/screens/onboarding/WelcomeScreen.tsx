import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.emoji}>🔍</Text>
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
    padding: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
