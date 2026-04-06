import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { radii } from '../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search locations...' }: Props) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={styles.bar}
      inputStyle={styles.input}
      iconColor="#888888"
      placeholderTextColor="#888888"
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#2A1A1A',
    borderRadius: radii.lg,
    elevation: 0,
  },
  input: {
    color: '#FFFFFF',
  },
});
