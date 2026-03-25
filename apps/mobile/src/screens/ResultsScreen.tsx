import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { MainStackScreenProps } from '../navigation/types';

export function ResultsScreen({ navigation, route }: MainStackScreenProps<'Results'>) {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Inspection Results</Text>
      <Text variant="bodyMedium">Inspection ID: {route.params.inspectionId}</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Home')} style={styles.button}>
        Back to Home
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
  button: {
    width: '100%',
  },
});
