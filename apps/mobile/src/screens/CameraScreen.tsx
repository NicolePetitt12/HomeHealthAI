import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import type { MainStackScreenProps } from '../navigation/types';

export function CameraScreen({ navigation }: MainStackScreenProps<'Camera'>) {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Camera</Text>
      <Text variant="bodyMedium">Camera integration coming soon</Text>
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
