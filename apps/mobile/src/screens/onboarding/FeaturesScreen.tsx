import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';
import { spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Features'>;

const FEATURES = [
  {
    icon: 'camera' as const,
    title: 'Photo Analysis',
    description: 'Take a photo of any suspicious area and get an instant AI risk assessment.',
  },
  {
    icon: 'flask-outline' as const,
    title: 'Mold Detection',
    description: 'AI identifies visual signs of mold and moisture damage with a confidence score.',
  },
  {
    icon: 'account-hard-hat' as const,
    title: 'Professional Referrals',
    description: 'Connect with local inspectors and remediation experts when needed.',
  },
];

export function FeaturesScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>How It Works</Text>
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.card}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={feature.icon} size={24} color="#2E7D32" />
              </View>
              <View style={styles.cardText}>
                <Text variant="titleSmall" style={styles.featureTitle}>{feature.title}</Text>
                <Text variant="bodySmall" style={styles.description}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <Button
        mode="contained"
        buttonColor="#2E7D32"
        onPress={() => navigation.navigate('Permissions')}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Next
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
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
  features: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: '#1E1E1E',
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: spacing.xs,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  description: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
  button: {
    marginTop: spacing.lg,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
