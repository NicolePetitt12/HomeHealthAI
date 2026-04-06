import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  children?: React.ReactNode;
}

export function AppBackground({ children }: Props) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
