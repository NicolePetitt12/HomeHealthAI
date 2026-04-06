import React, { useState, useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import {
  ScreenContainer,
  SearchBar,
  FilterChipRow,
  InspectionListItem,
} from '../components';
import { spacing } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';

type Props = MainTabScreenProps<'HistoryTab'>;

type FilterValue = 'all' | RiskLevel;

const FILTER_OPTIONS: Array<{ label: string; value: FilterValue; color?: string }> = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'high', color: '#C62828' },
  { label: 'Moderate', value: 'moderate', color: '#E65100' },
  { label: 'Low', value: 'low', color: '#C41E3A' },
];

const MOCK_HISTORY: Array<{
  id: string;
  location: string;
  date: string;
  riskLevel: RiskLevel;
  status: string;
}> = [
  { id: '1', location: 'Basement - West Wall', date: 'Oct 24, 2025', riskLevel: 'high', status: 'Action Required' },
  { id: '2', location: 'Master Bathroom Ceiling', date: 'Oct 22, 2025', riskLevel: 'moderate', status: 'Review Recommended' },
  { id: '3', location: 'Kitchen - Under Sink', date: 'Oct 18, 2025', riskLevel: 'low', status: 'Monitoring' },
  { id: '4', location: 'Attic - North Side', date: 'Oct 14, 2025', riskLevel: 'high', status: 'Action Required' },
  { id: '5', location: 'Laundry Room', date: 'Oct 10, 2025', riskLevel: 'moderate', status: 'Review Recommended' },
];

export function HistoryScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(() => {
    return MOCK_HISTORY.filter((item) => {
      const matchesFilter = filter === 'all' || item.riskLevel === filter;
      const matchesSearch = item.location.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [query, filter]);

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
            date={item.date}
            riskLevel={item.riskLevel}
            status={item.status}
            showViewDetails
            onPress={() => navigation.navigate('Results', { inspectionId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text variant="bodyMedium" style={styles.empty}>No inspections found.</Text>
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
  },
  empty: {
    color: '#888888',
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
