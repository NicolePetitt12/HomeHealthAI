import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  createPaymentSheet,
  createPortalSession,
  changeSubscription,
  cancelSubscription,
} from '../services/subscription';
import { useDialog } from '../components/AppDialog';

export function useCheckout() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();
  const { showDialog } = useDialog();

  return useMutation({
    mutationFn: async (priceId: string) => {
      // 1. Get payment sheet params from backend
      const { clientSecret, ephemeralKey, customerId } = await createPaymentSheet(priceId);

      // 2. Initialize the native Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Inspector Gnome',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        appearance: {
          colors: {
            primary: '#C41E3A',
            background: '#1C1212',
            componentBackground: '#2A1A1A',
            componentBorder: '#3A2020',
            componentDivider: '#3A2020',
            primaryText: '#FFFFFF',
            secondaryText: '#B0A0A0',
            componentText: '#FFFFFF',
            placeholderText: '#888888',
            icon: '#B0A0A0',
          },
        },
      });

      if (initError) throw new Error(initError.message);

      // 3. Present the Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') return 'canceled';
        throw new Error(presentError.message);
      }

      return 'success';
    },
    onSuccess: (result) => {
      if (result === 'success') {
        queryClient.invalidateQueries({ queryKey: ['entitlement'] });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });

        showDialog({
          title: 'Payment successful',
          message: 'Your subscription is being activated. It will be reflected shortly.',
        });

        // Poll every 3s for up to 30s; stop early once the entitlement tier
        // changes (webhook has been processed).
        const prevTier = (queryClient.getQueryData(['entitlement']) as { planTier?: string } | undefined)?.planTier;
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts += 1;
          await queryClient.invalidateQueries({ queryKey: ['entitlement'] });
          await queryClient.invalidateQueries({ queryKey: ['subscription'] });
          const newTier = (queryClient.getQueryData(['entitlement']) as { planTier?: string } | undefined)?.planTier;
          if (newTier !== prevTier || attempts >= 10) clearInterval(poll);
        }, 3000);
      }
    },
    onError: (err: Error) => {
      showDialog({ title: 'Payment failed', message: err.message });
    },
  });
}

export function useChangeSubscription() {
  const queryClient = useQueryClient();
  const { showDialog } = useDialog();

  return useMutation({
    mutationFn: (priceId: string) => changeSubscription(priceId),
    onSuccess: () => {
      // Invalidate immediately — the webhook may or may not have arrived yet.
      queryClient.invalidateQueries({ queryKey: ['entitlement'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });

      showDialog({
        title: 'Plan change submitted',
        message: 'Your payment is being processed. The new plan will be reflected shortly.',
      });

      // Poll every 3s for up to 30s; stop early once the entitlement tier
      // changes (webhook has been processed).
      const prevTier = (queryClient.getQueryData(['entitlement']) as { planTier?: string } | undefined)?.planTier;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        await queryClient.invalidateQueries({ queryKey: ['entitlement'] });
        await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        const newTier = (queryClient.getQueryData(['entitlement']) as { planTier?: string } | undefined)?.planTier;
        if (newTier !== prevTier || attempts >= 10) clearInterval(poll);
      }, 3000);
    },
    onError: (err: Error) => {
      showDialog({ title: 'Plan change failed', message: err.message });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { showDialog } = useDialog();

  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['entitlement'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      const endDate = new Date(result.currentPeriodEnd).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      showDialog({
        title: 'Subscription cancelled',
        message: `You'll keep access to your current plan until ${endDate}.`,
      });
    },
    onError: (err: Error) => {
      showDialog({ title: 'Cancellation failed', message: err.message });
    },
  });
}

export function usePortalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Customer Portal is web-only — opens in browser
      const { url } = await createPortalSession();
      await WebBrowser.openBrowserAsync(url);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['entitlement'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
