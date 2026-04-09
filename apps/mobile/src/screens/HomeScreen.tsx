import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { useUserScans, type ScanWithResult } from '../hooks/useUserScans';
import { useAppDispatch } from '../store/hooks';
import { setCurrentScan } from '../store/slices/inspectionSlice';
import type { MainTabScreenProps } from '../navigation/types';

type Props = MainTabScreenProps<'HomeTab'>;

const STATUS_LABELS: Record<string, string> = {
  high: 'Action Required',
  moderate: 'Review Recommended',
  low: 'Monitoring',
};

function MoldStatusSection() {
  const { data } = useMoldStatusCounts();
  const likely = data?.likelyMold ?? 0;
  const notSure = data?.notSure ?? 0;
  const unlikely = data?.unlikelyMold ?? 0;

  return (
    <View style={moldStyles.container}>
      <Text variant="titleMedium" style={moldStyles.title}>Mold Status</Text>
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
  const dispatch = useAppDispatch();
  const { data: recentScans } = useUserScans(5);

  function handleViewAll() {
    navigation.navigate('HistoryTab');
  }

  function handleScanPress(scan: ScanWithResult) {
    dispatch(setCurrentScan({
      id: scan.id,
      userId: scan.userId,
      imagePath: scan.imagePath,
      location: scan.location,
      notes: scan.notes,
      status: scan.status as 'pending' | 'processing' | 'completed' | 'failed',
      createdAt: scan.createdAt,
      updatedAt: scan.createdAt,
    }));
    navigation.navigate('DetailedResults', { inspectionId: scan.id, riskLevel: scan.riskLevel ?? undefined });
  }

  const hasScans = recentScans && recentScans.length > 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Dashboard</Text>
        <Text variant="bodySmall" style={styles.subtitle}>Home Health Assistant</Text>
      </View>

      <HeroCard title="Protect Your Home" subtitle="Scan for mold and moisture risks instantly" />

      <TouchableOpacity
        style={styles.startScanBtn}
        onPress={() => navigation.navigate('StartScan')}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
        <Text variant="labelLarge" style={styles.startScanText}>Start Scan</Text>
      </TouchableOpacity>

      <View style={styles.secondaryActions}>
        <ActionCard icon="clipboard-list-outline" label="Scan History" onPress={handleViewAll} iconColor="#FFFFFF" />
        <ActionCard icon="information" label="Learn More" onPress={() => {}} iconColor="#B0B0B0" />
      </View>

      <MoldStatusSection />

      <SectionHeader title="Recent Inspections" actionLabel="View All" onAction={handleViewAll} />

      {hasScans ? (
        recentScans.map((scan) => (
          <InspectionListItem
            key={scan.id}
            location={scan.location}
            date={new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            riskLevel={scan.riskLevel ?? 'low'}
            status={scan.riskLevel ? STATUS_LABELS[scan.riskLevel] ?? scan.status : scan.status}
            onPress={() => handleScanPress(scan)}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="magnify-scan" size={48} color="#3A3A3A" />
          <Text variant="bodyMedium" style={styles.emptyText}>No scans yet</Text>
          <Text variant="bodySmall" style={styles.emptySubtext}>
            Start your first scan to see results here.
          </Text>
        </View>
      )}

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
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  startScanBtn: {
    backgroundColor: '#C41E3A',
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  startScanText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  tip: {
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: '#888888',
  },
  emptySubtext: {
    color: '#555555',
    textAlign: 'center',
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
