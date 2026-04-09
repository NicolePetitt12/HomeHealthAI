import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { GnomeAvatar, type GnomeState } from './GnomeAvatar';
import { spacing, radii } from '../theme';

interface Props {
  title: string;
  subtitle: string;
  gnomeState?: GnomeState;
}

export function WelcomeCard({ title, subtitle, gnomeState = 'idle' }: Props) {
  return (
    <LinearGradient
      colors={['#1A0A0A', '#3A0A0A', '#1A0A0A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <GnomeAvatar state={gnomeState} size={110} />
      <View style={styles.textSide}>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    minHeight: 160,
    gap: spacing.lg,
  },
  textSide: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subtitle: {
    color: '#B0A0A0',
  },
});
