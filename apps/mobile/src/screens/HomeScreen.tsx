import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { MainStackScreenProps } from '../navigation/types';
import { useAuth } from '../hooks/useAuth';

export function HomeScreen({ navigation }: MainStackScreenProps<'Home'>) {
  const { signOut, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Welcome to Inspector Gnome</Text>
      {user?.email && (
        <Text variant="bodySmall" style={styles.email}>{user.email}</Text>
      )}
      <Text variant="bodyMedium" style={styles.subtitle}>
        Identify mold and moisture issues in your home
      </Text>
      <Button mode="contained" onPress={() => navigation.navigate('Camera')} style={styles.button}>
        Start Inspection
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('History')} style={styles.button}>
        View History
      </Button>
      <Button mode="text" onPress={signOut} style={styles.button}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  email: {
    opacity: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
});
