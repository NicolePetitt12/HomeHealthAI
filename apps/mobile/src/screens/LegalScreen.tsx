import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import { spacing } from '../theme';
import type { AuthStackScreenProps } from '../navigation/types';

// This screen is used from both AuthNavigator and MainNavigator.
// Route params always carry { title, content } — the navigator sets the header title.
type Props = AuthStackScreenProps<'Legal'>;

export function LegalScreen({ route }: Props) {
  const { content } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Markdown style={markdownStyles}>{content}</Markdown>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});

const markdownStyles = {
  body: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: '#121212',
  },
  heading1: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 22,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  heading2: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 18,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: '#E0E0E0',
    fontWeight: '600' as const,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  paragraph: {
    color: '#E0E0E0',
    marginBottom: spacing.md,
  },
  strong: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  em: {
    color: '#B0B0B0',
  },
  link: {
    color: '#2E7D32',
  },
  bullet_list: {
    marginBottom: spacing.md,
  },
  ordered_list: {
    marginBottom: spacing.md,
  },
  list_item: {
    color: '#E0E0E0',
  },
  hr: {
    backgroundColor: '#2A2A2A',
    height: 1,
    marginVertical: spacing.lg,
  },
  code_inline: {
    color: '#A5D6A7',
    backgroundColor: '#1E1E1E',
  },
};
