import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { LegalConsentProvider } from './src/contexts/LegalConsentContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppDialogProvider } from './src/components/AppDialog';
import { theme } from './src/theme';
import { registerForPushNotifications, configureForegroundNotifications } from './src/services/pushNotifications';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

const queryClient = new QueryClient();

configureForegroundNotifications();

// Registers push token when authenticated
function NotificationHandler() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      registerForPushNotifications(user.id);
    }
  }, [user?.id]);

  return null;
}

// Listens for inspectorgnome://subscription/* deep links and refreshes
// entitlement/subscription data when the user returns from Stripe Checkout.
function SubscriptionDeepLinkHandler() {
  const qc = useQueryClient();

  useEffect(() => {
    function handleUrl({ url }: { url: string }) {
      if (url.startsWith('inspectorgnome://subscription/')) {
        qc.invalidateQueries({ queryKey: ['entitlement'] });
        qc.invalidateQueries({ queryKey: ['subscription'] });
      }
    }

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, [qc]);

  return null;
}

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.inspectorgnome">
      <ReduxProvider store={store}>
        <AuthProvider>
          <OnboardingProvider>
            <LegalConsentProvider>
              <QueryClientProvider client={queryClient}>
                <PaperProvider theme={theme}>
                  <AppDialogProvider>
                    <NavigationContainer theme={{ ...NavDarkTheme, colors: { ...NavDarkTheme.colors, background: '#000000' } }}>
                      <RootNavigator />
                      <StatusBar style="light" />
                      <SubscriptionDeepLinkHandler />
                      <NotificationHandler />
                    </NavigationContainer>
                  </AppDialogProvider>
                </PaperProvider>
              </QueryClientProvider>
            </LegalConsentProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ReduxProvider>
    </StripeProvider>
  );
}
