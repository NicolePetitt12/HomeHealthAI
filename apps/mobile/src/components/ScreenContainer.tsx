import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../theme';
import { AppBackground } from './AppBackground';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
}

export function ScreenContainer({ children, scrollable = true, padded = true }: Props) {
  const inner = padded ? (
    <View style={styles.padded}>{children}</View>
  ) : (
    <>{children}</>
  );

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe}>
        {scrollable ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={styles.fill}>{inner}</View>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fill: {
    flex: 1,
  },
  padded: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
