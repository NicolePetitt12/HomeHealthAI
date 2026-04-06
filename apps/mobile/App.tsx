import React from 'react';
import { NavigationContainer, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store';
import { AuthProvider } from './src/contexts/AuthContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { LegalConsentProvider } from './src/contexts/LegalConsentContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { theme } from './src/theme';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <OnboardingProvider>
          <LegalConsentProvider>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={theme}>
                <NavigationContainer theme={{ ...NavDarkTheme, colors: { ...NavDarkTheme.colors, background: '#000000' } }}>
                  <RootNavigator />
                  <StatusBar style="light" />
                </NavigationContainer>
              </PaperProvider>
            </QueryClientProvider>
          </LegalConsentProvider>
        </OnboardingProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
