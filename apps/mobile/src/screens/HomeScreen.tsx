import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  ScreenContainer,
  HeroCard,
  ActionCard,
  SectionHeader,
  InspectionListItem,
  GnomeTip,
} from '../components';
import { spacing, radii } from '../theme';
import { useMoldStatusCounts } from '../hooks/useMoldStatusCounts';
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
  {
    id: '1',
    location: 'Basement - West Wall',
    date: 'Oct 24, 2025',
    riskLevel: 'moderate',
    status: 'Review Recommended',
  },
  {
    id: '2',
    location: 'Master Bathroom',
    date: 'Oct 22, 2025',
    riskLevel: 'low',
    status: 'Monitoring',
  },
];

function MoldStatusSection() {
  const { data } = useMoldStatusCounts();
  const likely = data?.likelyMold ?? 0;
  const notSure = data?.notSure ?? 0;
  const unlikely = data?.unlikelyMold ?? 0;

  return (
    <View style={moldStyles.container}>
      <Text variant="titleMedium" style={moldStyles.title}>
        Mold Status
      </Text>

      {/* Top row */}
      <View style={moldStyles.row}>
        <View style={[moldStyles.cell, moldStyles.likelyCell]}>
          <Text style={moldStyles.likelyLabel}>Likely Mold</Text>
          <View style={moldStyles.likelyRight}>
            <MaterialCommunityIcons name="alert" size={16} color="#FFFFFF" />
            <Text style={moldStyles.likelyCount}>{likely}</Text>
          </View>
        </View>
        <View style={[moldStyles.cell, moldStyles.darkCell]}>
          <Text style={moldStyles.cellLabel}>Not Sure</Text>
          <Text style={moldStyles.cellCount}>{notSure}</Text>
        </View>
      </View>

      {/* Bottom row */}
      <View style={moldStyles.row}>
        <View style={[moldStyles.cell, moldStyles.darkCell, moldStyles.fullCell]}>
          <Text style={moldStyles.cellLabel}>Unlikely Mold</Text>
          <Text style={[moldStyles.cellCount, moldStyles.greenCount]}>{unlikely}</Text>
        </View>
      </View>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
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
      navigation.navigate('PhotoReview', { imageUri: result.assets[0].uri, source: 'gallery' });
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
        <Text variant="headlineMedium" style={styles.title}>
          Dashboard
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Home Health Assistant
        </Text>
      </View>

      <HeroCard title="Protect Your Home" subtitle="Scan for mold and moisture risks instantly" />

      <View style={styles.actions}>
        <ActionCard icon="camera" label="Take Photo" onPress={handleCamera} />
        <ActionCard icon="upload" label="Upload" onPress={handleUpload} />
      </View>

      <View style={[styles.actions, styles.actionsSecondary]}>
        <ActionCard
          icon="clipboard-list-outline"
          label="Scan History"
          onPress={handleViewAll}
          iconColor="#FFFFFF"
        />
        <ActionCard icon="information" label="Learn More" onPress={() => {}} iconColor="#B0B0B0" />
      </View>

      <MoldStatusSection />

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
  actionsSecondary: {
    marginTop: -spacing.lg,
  },
  tip: {
    marginTop: spacing.xl,
  },
});

const moldStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  likelyCell: {
    backgroundColor: '#C41E3A',
  },
  darkCell: {
    backgroundColor: '#1C1212',
  },
  fullCell: {
    flex: 1,
  },
  likelyLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  likelyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  likelyCount: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  cellLabel: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  cellCount: {
    color: '#B0B0B0',
    fontWeight: '700',
    fontSize: 16,
  },
  greenCount: {
    color: '#81C784',
  },
});
