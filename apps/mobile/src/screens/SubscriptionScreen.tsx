import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground, useDialog } from '../components';
import { useEntitlement, usePlans, useSubscription } from '../hooks/useSubscription';
import { useCheckout, usePortalSession, useChangeSubscription, useCancelSubscription } from '../hooks/useCheckout';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';
import type { Plan, PlanTier } from '@inspector-gnome/shared';

type Props = MainStackScreenProps<'Subscription'>;

// Static UI metadata keyed by appPlanId
const PLAN_UI: Record<'home' | 'pro', {
  scans: string;
  features: string[];
  color: string;
  recommended: boolean;
}> = {
  home: {
    scans: '20 scans / month',
    features: ['Everything in Free', '20 scans per month', 'Detailed recommendations', 'Priority support'],
    color: '#1565C0',
    recommended: false,
  },
  pro: {
    scans: 'Unlimited scans',
    features: ['Everything in Home', 'Unlimited scans', 'Professional referrals', 'Full inspection history'],
    color: '#C41E3A',
    recommended: true,
  },
};

const FREE_CARD = {
  tier: 'free' as PlanTier,
  label: 'Free',
  price: '$0',
  scans: '3 scans / month',
  features: ['Basic AI mold detection', 'Scan history', 'Risk assessment'],
  color: '#5A5A5A',
  recommended: false,
};

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(unitAmount / 100);
}

export function SubscriptionScreen({ navigation: _navigation }: Props) {
  const { data: entitlement, isLoading: entitlementLoading } = useEntitlement();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: subscription } = useSubscription();
  const { showDialog } = useDialog();
  const checkoutMutation = useCheckout();
  const changeSubMutation = useChangeSubscription();
  const cancelSubMutation = useCancelSubscription();
  const portalMutation = usePortalSession();

  const currentTier: PlanTier = entitlement?.planTier ?? 'free';
  const hasActiveSubscription = !!subscription?.stripeSubscriptionId;
  const isLoading = entitlementLoading || plansLoading;

  // Track which priceId is being processed so we show the spinner on the right card
  const pendingPriceId: string | null =
    changeSubMutation.isPending ? (changeSubMutation.variables as string) ?? null
    : checkoutMutation.isPending ? (checkoutMutation.variables as string) ?? null
    : null;

  const isBusy =
    checkoutMutation.isPending ||
    changeSubMutation.isPending ||
    cancelSubMutation.isPending ||
    portalMutation.isPending;

  // After a change is submitted, show a "processing" notice on all plan cards
  // until the webhook arrives and React Query refetches with the new tier.
  const isProcessing = changeSubMutation.isSuccess || checkoutMutation.isSuccess;

  // When currentTier changes it means the webhook was received and the DB was
  // updated. Reset mutation state so the processing banner disappears.
  const prevTierRef = useRef(currentTier);
  useEffect(() => {
    if (prevTierRef.current !== currentTier) {
      prevTierRef.current = currentTier;
      if (changeSubMutation.isSuccess) changeSubMutation.reset();
      if (checkoutMutation.isSuccess) checkoutMutation.reset();
    }
  }, [currentTier, changeSubMutation, checkoutMutation]);

  function handleSelectPlan(plan: Plan) {
    if (plan.appPlanId === currentTier) {
      portalMutation.mutate();
      return;
    }
    if (hasActiveSubscription) {
      changeSubMutation.mutate(plan.priceId);
    } else {
      checkoutMutation.mutate(plan.priceId);
    }
  }

  function handleCancelToFree() {
    showDialog({
      title: 'Downgrade to Free?',
      message: "You'll keep your current plan until the end of your billing period, then revert to Free (3 scans/month).",
      buttons: [
        { text: 'Keep Plan', style: 'cancel' },
        { text: 'Downgrade', style: 'destructive', onPress: () => cancelSubMutation.mutate() },
      ],
    });
  }

  function getButtonLabel(plan: Plan): string {
    const tier = plan.appPlanId as PlanTier;
    if (pendingPriceId === plan.priceId) return 'Processing…';
    if (tier === currentTier) return 'Manage plan';
    if (currentTier !== 'free' && tier === 'pro') return 'Upgrade';
    if (currentTier !== 'free' && tier === 'home') return 'Downgrade';
    return 'Get started';
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text variant="headlineMedium" style={styles.heading}>Choose Your Plan</Text>
          <Text variant="bodyMedium" style={styles.subheading}>
            Upgrade to get more scans and unlock all features.
          </Text>

          {isProcessing && (
            <View style={styles.processingBanner}>
              <ActivityIndicator size="small" color="#FFB74D" />
              <Text style={styles.processingText}>
                Processing your plan change… this may take a few seconds.
              </Text>
            </View>
          )}

          {isLoading ? (
            <ActivityIndicator size="large" color="#C41E3A" style={styles.loader} />
          ) : (
            <View style={styles.plans}>
              {/* Free tier — always shown, no Stripe data needed */}
              <View style={[
                styles.planCard,
                currentTier === 'free' && styles.planCardActive,
                { borderColor: currentTier === 'free' ? FREE_CARD.color : '#2A1A1A' },
              ]}>
                <View style={styles.planHeader}>
                  <View>
                    <Text variant="titleLarge" style={[styles.planLabel, { color: FREE_CARD.color }]}>
                      {FREE_CARD.label}
                    </Text>
                    <Text variant="bodySmall" style={styles.planScans}>{FREE_CARD.scans}</Text>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={[styles.priceAmount, { color: FREE_CARD.color }]}>{FREE_CARD.price}</Text>
                  </View>
                </View>
                <View style={styles.features}>
                  {FREE_CARD.features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={FREE_CARD.color} />
                      <Text variant="bodySmall" style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
                {currentTier === 'free' || entitlement?.cancelAtPeriodEnd ? (
                  <View style={[styles.planButton, { borderWidth: 1, borderColor: FREE_CARD.color + '66' }]}>
                    <Text style={[styles.planButtonText, { color: FREE_CARD.color }]}>
                      {currentTier === 'free' ? 'Current plan' : 'Cancellation pending'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.planButton, { borderWidth: 1, borderColor: FREE_CARD.color + '66' }]}
                    onPress={handleCancelToFree}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    {cancelSubMutation.isPending ? (
                      <ActivityIndicator size="small" color={FREE_CARD.color} />
                    ) : (
                      <Text style={[styles.planButtonText, { color: FREE_CARD.color }]}>
                        Downgrade to Free
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Paid plans — from backend */}
              {(plans ?? []).map((plan) => {
                const ui = PLAN_UI[plan.appPlanId];
                if (!ui) return null;
                const isCurrent = plan.appPlanId === currentTier;
                const isDisabled = isBusy;

                return (
                  <View key={plan.appPlanId} style={[
                    styles.planCard,
                    isCurrent && styles.planCardActive,
                    ui.recommended && styles.planCardRecommended,
                    { borderColor: isCurrent ? ui.color : '#2A1A1A' },
                  ]}>
                    {ui.recommended && (
                      <View style={[styles.recommendedBadge, { backgroundColor: ui.color }]}>
                        <Text style={styles.recommendedText}>Most Popular</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View>
                        <Text variant="titleLarge" style={[styles.planLabel, { color: ui.color }]}>
                          {plan.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.planScans}>{ui.scans}</Text>
                      </View>
                      <View style={styles.priceBlock}>
                        <Text style={[styles.priceAmount, { color: ui.color }]}>
                          {formatPrice(plan.unitAmount, plan.currency)}
                        </Text>
                        <Text style={styles.priceInterval}>/{plan.interval}</Text>
                      </View>
                    </View>

                    <View style={styles.features}>
                      {ui.features.map((f) => (
                        <View key={f} style={styles.featureRow}>
                          <MaterialCommunityIcons name="check-circle" size={16} color={ui.color} />
                          <Text variant="bodySmall" style={styles.featureText}>{f}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.planButton,
                        { backgroundColor: isCurrent || isBusy ? 'transparent' : ui.color },
                        (isCurrent || isBusy) && { borderWidth: 1, borderColor: ui.color + '66' },
                      ]}
                      onPress={() => handleSelectPlan(plan)}
                      disabled={isBusy}
                      activeOpacity={0.8}
                    >
                      {pendingPriceId === plan.priceId ? (
                        <ActivityIndicator size="small" color={ui.color} />
                      ) : (
                        <Text style={[
                          styles.planButtonText,
                          { color: isCurrent || isBusy ? ui.color : '#FFFFFF' },
                        ]}>
                          {getButtonLabel(plan)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Fallback when Stripe isn't configured yet */}
              {!plansLoading && (!plans || plans.length === 0) && (
                <Text style={styles.noPlans}>
                  Paid plans are not available yet. Check back soon.
                </Text>
              )}
            </View>
          )}

          {currentTier !== 'free' && (
            <TouchableOpacity
              style={styles.portalLink}
              onPress={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending
                ? <ActivityIndicator size="small" color="#888888" />
                : <Text style={styles.portalLinkText}>Manage billing & invoices</Text>
              }
            </TouchableOpacity>
          )}

          <Text style={styles.footer}>
            Subscriptions are billed monthly and can be cancelled at any time.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  heading: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subheading: {
    color: '#B0A0A0',
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#2A2010',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#5A4010',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  processingText: {
    flex: 1,
    color: '#FFB74D',
    fontSize: 13,
    lineHeight: 18,
  },
  loader: {
    marginTop: spacing.xxxl,
  },
  plans: {
    gap: spacing.lg,
  },
  planCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#2A1A1A',
    overflow: 'visible',
  },
  planCardActive: {
    backgroundColor: '#231515',
  },
  planCardRecommended: {
    marginTop: spacing.lg,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  planLabel: {
    fontWeight: '700',
  },
  planScans: {
    color: '#888888',
    marginTop: spacing.xs,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  priceInterval: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 4,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    color: '#D0D0D0',
    flex: 1,
  },
  planButton: {
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  planButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  portalLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  portalLinkText: {
    color: '#888888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  noPlans: {
    color: '#888888',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    color: '#5A5A5A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
