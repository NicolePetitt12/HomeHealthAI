import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'ComingSoon'>;

export function ComingSoonScreen({ navigation }: Props) {
  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="clock-outline" size={56} color="#C41E3A" />
        </View>
        <Text variant="headlineSmall" style={styles.title}>Coming Soon</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          This feature is currently under development and will be available in a future update.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text variant="labelLarge" style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1C1212',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: spacing.xl,
    backgroundColor: '#1C1212',
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderWidth: 1,
    borderColor: '#3A2020',
  },
  btnText: {
    color: '#FFFFFF',
  },
});
