import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radii } from '../theme';
import { useEntitlement } from '../hooks/useSubscription';
import { usePortalSession } from '../hooks/useCheckout';
import type { PlanTier } from '@inspector-gnome/shared';

interface Props {
  onManagePlan: () => void;
}

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  home: 'Home',
  pro: 'Pro',
};

const PLAN_COLORS: Record<PlanTier, string> = {
  free: '#5A5A5A',
  home: '#1565C0',
  pro: '#C41E3A',
};

export function SubscriptionCard({ onManagePlan }: Props) {
  const { data: entitlement, isLoading } = useEntitlement();
  const portalMutation = usePortalSession();

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color="#C41E3A" />
      </View>
    );
  }

  const tier: PlanTier = entitlement?.planTier ?? 'free';
  const planLabel = PLAN_LABELS[tier];
  const planColor = PLAN_COLORS[tier];
  const used = entitlement?.scansUsedThisMonth ?? 0;
  const allowed = entitlement?.scansAllowedThisMonth ?? 3;
  const isUnlimited = allowed === -1;
  const isSubscribed = tier !== 'free';

  const progress = isUnlimited ? 1 : Math.min(used / allowed, 1);

  function formatPeriodEnd(iso: string | null | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="crown-outline" size={20} color={planColor} />
          <Text variant="titleMedium" style={styles.planName}>My Plan</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: planColor + '33', borderColor: planColor }]}>
          <Text style={[styles.badgeText, { color: planColor }]}>{planLabel}</Text>
        </View>
      </View>

      {/* Scan usage */}
      <View style={styles.usageRow}>
        <Text variant="bodySmall" style={styles.usageLabel}>
          {isUnlimited
            ? 'Unlimited scans this month'
            : `${used} of ${allowed} scans used this month`}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: planColor }]} />
      </View>

      {/* Renewal info */}
      {isSubscribed && entitlement?.currentPeriodEnd && (
        <Text variant="bodySmall" style={styles.renewalText}>
          {entitlement.cancelAtPeriodEnd
            ? `Cancels ${formatPeriodEnd(entitlement.currentPeriodEnd)}`
            : `Renews ${formatPeriodEnd(entitlement.currentPeriodEnd)}`}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onManagePlan} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>
            {isSubscribed ? 'Change Plan' : 'Upgrade'}
          </Text>
        </TouchableOpacity>

        {isSubscribed && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => portalMutation.mutate()}
            activeOpacity={0.8}
            disabled={portalMutation.isPending}
          >
            {portalMutation.isPending
              ? <ActivityIndicator size="small" color="#B0B0B0" />
              : <Text style={styles.actionButtonTextSecondary}>Manage Billing</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: '#2A1A1A',
    gap: spacing.sm,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  usageLabel: {
    color: '#B0A0A0',
  },
  usageRow: {
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#3A2020',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  renewalText: {
    color: '#888888',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#C41E3A',
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3A2020',
  },
  actionButtonTextSecondary: {
    color: '#B0B0B0',
    fontWeight: '600',
    fontSize: 14,
  },
});
