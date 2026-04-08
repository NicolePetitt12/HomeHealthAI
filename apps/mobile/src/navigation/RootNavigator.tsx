import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useLegalConsent } from '../contexts/LegalConsentContext';
import { LegalConsentScreen } from '../screens/LegalConsentScreen';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { ResultsScreen } from '../screens/ResultsScreen';
import { DetailedResultsScreen } from '../screens/DetailedResultsScreen';
import { FindAProScreen } from '../screens/FindAProScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { StartScanScreen } from '../screens/StartScanScreen';
import { PhotoReviewScreen } from '../screens/PhotoReviewScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import type { RootStackParamList, MainStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const Main = createNativeStackNavigator<MainStackParamList>();

function MainNavigator() {
  return (
    <Main.Navigator screenOptions={{ headerShown: false }}>
      <Main.Screen name="Tabs" component={MainTabNavigator} />
      <Main.Screen
        name="StartScan"
        component={StartScanScreen}
        options={{ headerShown: true, title: 'New Scan', headerStyle: { backgroundColor: '#1A1A1A' }, headerTintColor: '#FFFFFF' }}
      />
      <Main.Screen
        name="Camera"
        component={CameraScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Main.Screen
        name="Results"
        component={ResultsScreen}
        options={{ headerShown: true, title: 'AI Analysis', headerStyle: { backgroundColor: '#1A1A1A' }, headerTintColor: '#FFFFFF' }}
      />
      <Main.Screen
        name="DetailedResults"
        component={DetailedResultsScreen}
        options={{ headerShown: true, title: 'Scan Report', headerStyle: { backgroundColor: '#1A1A1A' }, headerTintColor: '#FFFFFF' }}
      />
      <Main.Screen
        name="FindAPro"
        component={FindAProScreen}
        options={{ headerShown: true, title: 'Find a Pro', headerStyle: { backgroundColor: '#1A1A1A' }, headerTintColor: '#FFFFFF' }}
      />
      <Main.Screen
        name="PhotoReview"
        component={PhotoReviewScreen}
        options={{ headerShown: true, title: 'Review Photo', headerStyle: { backgroundColor: '#1A1A1A' }, headerTintColor: '#FFFFFF' }}
      />
      <Main.Screen
        name="Legal"
        component={LegalScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.title,
          headerStyle: { backgroundColor: '#1A1A1A' },
          headerTintColor: '#FFFFFF',
        })}
      />
      <Main.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.title,
          headerStyle: { backgroundColor: '#1A1A1A' },
          headerTintColor: '#FFFFFF',
        })}
      />
    </Main.Navigator>
  );
}

export function RootNavigator() {
  const { session, isLoading } = useAuth();
  const { hasOnboarded } = useOnboarding();
  const { hasAcceptedTerms } = useLegalConsent();

  if (isLoading || hasOnboarded === null || hasAcceptedTerms === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#C41E3A" />
      </View>
    );
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!hasOnboarded ? (
        <Root.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !hasAcceptedTerms ? (
        <Root.Screen name="TermsAcceptance" component={LegalConsentScreen} />
      ) : !session ? (
        <Root.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Root.Screen name="Main" component={MainNavigator} />
      )}
    </Root.Navigator>
  );
}
