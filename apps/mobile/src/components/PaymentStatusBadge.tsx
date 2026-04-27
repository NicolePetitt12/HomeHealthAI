import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid:          { bg: '#1A3A1A', text: '#22C55E' },
  failed:        { bg: '#3A1A1A', text: '#C41E3A' },
  refunded:      { bg: '#1A1A3A', text: '#6699FF' },
  open:          { bg: '#2A2A1A', text: '#F59E0B' },
  uncollectible: { bg: '#2A1A1A', text: '#888888' },
  void:          { bg: '#2A2A2A', text: '#888888' },
};

const DEFAULT_COLORS = { bg: '#2A2A2A', text: '#888888' };

interface Props {
  status: string;
}

export function PaymentStatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status.toLowerCase()] ?? DEFAULT_COLORS;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
