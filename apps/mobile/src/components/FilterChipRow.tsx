import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { spacing } from '../theme';

interface Option {
  label: string;
  value: string;
  color?: string;
}

interface Props {
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
}

export function FilterChipRow({ options, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <Chip
            key={opt.value}
            selected={isSelected}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              isSelected && { backgroundColor: opt.color ?? '#2E7D32' },
            ]}
            textStyle={[
              styles.chipText,
              isSelected && styles.chipTextSelected,
            ]}
            showSelectedCheck={false}
          >
            {opt.label}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    backgroundColor: '#2A2A2A',
  },
  chipText: {
    color: '#B0B0B0',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
