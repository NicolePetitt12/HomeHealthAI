import React from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { spacing, radii } from '../theme';
import type { Invoice } from '@inspector-gnome/shared';

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface Props {
  invoice: Invoice;
  onDownload: (invoiceId: string) => void;
  isDownloading: boolean;
}

export function PaymentListItem({ invoice, onDownload, isDownloading }: Props) {
  const planLabel = invoice.planTier
    ? invoice.planTier.charAt(0).toUpperCase() + invoice.planTier.slice(1) + ' Plan'
    : '—';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.date}>{formatDate(invoice.createdAt)}</Text>
          <Text style={styles.plan}>{planLabel}</Text>
          <Text style={styles.amount}>{formatAmount(invoice.amountPaid, invoice.currency)}</Text>
          <PaymentStatusBadge status={invoice.status} />
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => onDownload(invoice.id)}
          disabled={isDownloading}
          accessibilityLabel="Download invoice PDF"
        >
          {isDownloading ? (
            <ActivityIndicator size={18} color="#C41E3A" />
          ) : (
            <MaterialCommunityIcons name="file-download-outline" size={22} color="#C41E3A" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#2A1A1A',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  date: {
    fontSize: 12,
    color: '#888888',
  },
  plan: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  downloadBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
