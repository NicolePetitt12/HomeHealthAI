import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import type { RootStackParamList, MainStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();
const Main = createNativeStackNavigator<MainStackParamList>();

function MainNavigator() {
  return (
    <Main.Navigator initialRouteName="Home">
      <Main.Screen name="Home" component={HomeScreen} options={{ title: 'Inspector Gnome' }} />
      <Main.Screen name="Camera" component={CameraScreen} options={{ title: 'New Inspection' }} />
      <Main.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      <Main.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    </Main.Navigator>
  );
}

export function RootNavigator() {
  const { session, isLoading } = useAuth();
  const { hasOnboarded } = useOnboarding();

  if (isLoading || hasOnboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!hasOnboarded ? (
        <Root.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : !session ? (
        <Root.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <Root.Screen name="Main" component={MainNavigator} />
      )}
    </Root.Navigator>
  );
}
