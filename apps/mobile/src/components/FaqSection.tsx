import React from 'react';
import { View } from 'react-native';
import Markdown from '@ronradtke/react-native-markdown-display';
import { spacing } from '../theme';
import { FAQ_MD } from '../content/faq';

const markdownStyles = {
  body: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'transparent',
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
  hr: {
    backgroundColor: '#2A1A1A',
    height: 1,
    marginVertical: spacing.lg,
  },
};

export function FaqSection() {
  return (
    <View>
      <Markdown style={markdownStyles}>{FAQ_MD}</Markdown>
    </View>
  );
}
