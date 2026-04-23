import React, { useState, useMemo } from 'react';
import { FlatList, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ScreenContainer,
  SearchBar,
  FilterChipRow,
  InspectionListItem,
} from '../components';
import { spacing, radii } from '../theme';
import { useUserScans } from '../hooks/useUserScans';
import { useAppDispatch } from '../store/hooks';
import { setCurrentScan } from '../store/slices/inspectionSlice';
import type { MainTabScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';
import type { ScanWithResult } from '../hooks/useUserScans';

type Props = MainTabScreenProps<'HistoryTab'>;

type FilterValue = 'all' | RiskLevel;

const FILTER_OPTIONS: Array<{ label: string; value: FilterValue; color?: string }> = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'high', color: '#C62828' },
  { label: 'Moderate', value: 'moderate', color: '#E65100' },
  { label: 'Low', value: 'low', color: '#C41E3A' },
];

const STATUS_LABELS: Record<string, string> = {
  high: 'Action Required',
  moderate: 'Review Recommended',
  low: 'Monitoring',
};

export function HistoryScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { data: scans, isLoading } = useUserScans();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(() => {
    if (!scans) return [];
    return scans.filter((item) => {
      const matchesFilter = filter === 'all' || item.riskLevel === filter;
      const matchesSearch = item.location.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [scans, query, filter]);

  function handleScanPress(scan: ScanWithResult) {
    dispatch(setCurrentScan({
      id: scan.id,
      userId: scan.userId,
      imagePath: scan.imagePath,
      location: scan.location,
      notes: scan.notes,
      status: scan.status as 'pending' | 'processing' | 'completed' | 'failed',
      recurringIssue: 'unknown' as const,
      mustyOdorPresent: 'unknown' as const,
      recentWaterEvent: 'unknown' as const,
      occupantSymptomsReported: 'unknown' as const,
      humidityPercent: null,
      temperatureF: null,
      createdAt: scan.createdAt,
      updatedAt: scan.createdAt,
    }));
    navigation.navigate('DetailedResults', { inspectionId: scan.id, riskLevel: scan.riskLevel ?? undefined });
  }

  return (
    <ScreenContainer scrollable={false} padded={false}>
      <View style={styles.inner}>
        <Text variant="headlineSmall" style={styles.title}>Inspection History</Text>
        <SearchBar value={query} onChangeText={setQuery} />
        <FilterChipRow
          options={FILTER_OPTIONS}
          selected={filter}
          onSelect={(v) => setFilter(v as FilterValue)}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <InspectionListItem
            location={item.location}
            date={new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            riskLevel={item.riskLevel ?? 'low'}
            status={item.riskLevel ? STATUS_LABELS[item.riskLevel] ?? item.status : item.status}
            showViewDetails
            onPress={() => handleScanPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="clipboard-text-search-outline" size={56} color="#C41E3A" />
            </View>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {isLoading ? 'Loading scans…' : 'No Scans Yet'}
            </Text>
            {!isLoading && (
              <>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Your scan history will appear here once you perform your first inspection.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('StartScan')}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
                  <Text variant="labelLarge" style={styles.emptyBtnText}>Start Your First Scan</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1C1212',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    backgroundColor: '#C41E3A',
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
