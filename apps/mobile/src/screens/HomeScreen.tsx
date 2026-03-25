import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import {
  ScreenContainer,
  HeroCard,
  ActionCard,
  SectionHeader,
  InspectionListItem,
  GnomeTip,
} from '../components';
import { spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';

type Props = MainTabScreenProps<'HomeTab'>;

const MOCK_INSPECTIONS: Array<{
  id: string;
  location: string;
  date: string;
  riskLevel: RiskLevel;
  status: string;
}> = [
  { id: '1', location: 'Basement - West Wall', date: 'Oct 24, 2025', riskLevel: 'moderate', status: 'Review Recommended' },
  { id: '2', location: 'Master Bathroom', date: 'Oct 22, 2025', riskLevel: 'low', status: 'Monitoring' },
];

export function HomeScreen({ navigation }: Props) {
  async function handleUpload() {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      navigation.navigate('Camera');
    }
  }

  function handleCamera() {
    navigation.navigate('Camera');
  }

  function handleViewAll() {
    navigation.navigate('HistoryTab');
  }

  function handleInspection(id: string) {
    navigation.navigate('Results', { inspectionId: id });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Inspector Gnome</Text>
        <Text variant="bodySmall" style={styles.subtitle}>Home Health Assistant</Text>
      </View>

      <HeroCard
        title="Protect Your Home"
        subtitle="Scan for mold and moisture risks instantly"
      />

      <View style={styles.actions}>
        <ActionCard icon="camera" label="Take Photo" onPress={handleCamera} />
        <ActionCard icon="upload" label="Upload" onPress={handleUpload} />
      </View>

      <SectionHeader title="Recent Inspections" actionLabel="View All" onAction={handleViewAll} />

      {MOCK_INSPECTIONS.map((item) => (
        <InspectionListItem
          key={item.id}
          location={item.location}
          date={item.date}
          riskLevel={item.riskLevel}
          status={item.status}
          onPress={() => handleInspection(item.id)}
        />
      ))}

      <View style={styles.tip}>
        <GnomeTip text="Keep indoor humidity below 60% to prevent mold growth. Use a dehumidifier in damp areas like basements and bathrooms." />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#B0B0B0',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  tip: {
    marginTop: spacing.xl,
  },
});
