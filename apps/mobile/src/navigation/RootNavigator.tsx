import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inspector Gnome' }} />
      <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'New Inspection' }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
    </Stack.Navigator>
  );
}
