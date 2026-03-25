import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { MainStackScreenProps } from '../navigation/types';

export function HistoryScreen({ navigation }: MainStackScreenProps<'History'>) {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Inspection History</Text>
      <Text variant="bodyMedium">No inspections yet</Text>
      <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.button}>
        Go Back
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
