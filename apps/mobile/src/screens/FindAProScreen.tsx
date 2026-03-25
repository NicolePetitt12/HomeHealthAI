import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, ProfessionalCard } from '../components';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';
import type { Professional } from '@inspector-gnome/shared';

type Props = MainStackScreenProps<'FindAPro'>;

const MOCK_PROFESSIONALS: Array<Professional & { rating: number; distance: string; tags: string[] }> = [
  {
    id: '1',
    userId: null,
    businessName: 'Sarah Mitchell',
    professionalType: 'inspector',
    email: 'sarah@example.com',
    phone: '+15551234567',
    website: null,
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    description: null,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rating: 4.9,
    distance: '2.1 miles away',
    tags: ['Licensed', 'Insured', 'IICRC Certified'],
  },
  {
    id: '2',
    userId: null,
    businessName: 'David Chen',
    professionalType: 'remediation',
    email: 'david@example.com',
    phone: '+15559876543',
    website: null,
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    description: null,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rating: 4.8,
    distance: '3.2 miles away',
    tags: ['Emergency Service', '24/7 Response'],
  },
];

export function FindAProScreen({ navigation: _ }: Props) {
  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information-outline" size={20} color="#2E7D32" />
        <View style={styles.infoText}>
          <Text variant="labelMedium" style={styles.infoTitle}>Based on your scan</Text>
          <Text variant="bodySmall" style={styles.infoBody}>
            Showing professionals specialized in mold inspection and moisture remediation in your area.
          </Text>
        </View>
      </View>

      <FlatList
        data={MOCK_PROFESSIONALS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProfessionalCard
            professional={item}
            rating={item.rating}
            distance={item.distance}
            tags={item.tags}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#1E3A1E',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoText: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    color: '#81C784',
    fontWeight: '600',
  },
  infoBody: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
});
