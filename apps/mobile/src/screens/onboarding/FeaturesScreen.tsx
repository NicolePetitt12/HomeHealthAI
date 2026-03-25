import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Features'>;

const FEATURES = [
  {
    icon: '📸',
    title: 'Photo Analysis',
    description: 'Take a photo of any suspicious area and get an instant AI risk assessment.',
  },
  {
    icon: '🧪',
    title: 'Mold Detection',
    description: 'AI identifies visual signs of mold and moisture damage with a confidence score.',
  },
  {
    icon: '👷',
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
            <Card key={feature.title} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.icon}>{feature.icon}</Text>
                <View style={styles.cardText}>
                  <Text variant="titleMedium">{feature.title}</Text>
                  <Text variant="bodyMedium" style={styles.description}>
                    {feature.description}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>
      <Button
        mode="contained"
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
    padding: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  features: {
    gap: 12,
  },
  card: {
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 32,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  description: {
    opacity: 0.7,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
