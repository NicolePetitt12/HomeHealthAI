import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { ScreenContainer, RiskBadge, ConfidenceBar, GnomeAvatar } from '../components';
import { spacing, radii } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';
import type { GnomeState } from '../components';

type Props = MainStackScreenProps<'Results'>;

// Mock data — will be replaced with React Query
const MOCK_RESULT = {
  location: 'Basement - West Wall',
  riskLevel: 'moderate' as RiskLevel,
  confidence: 87,
  explanation:
    'I analyzed your photo and found some moisture staining on the wall surface. This often indicates humidity levels are too high or there is a small leak. I recommend checking your gutters and ensuring proper ventilation in this area.',
};

function gnomeStateForRisk(risk: RiskLevel): GnomeState {
  return risk === 'low' ? 'idle' : 'concern';
}

export function ResultsScreen({ navigation, route }: Props) {
  const result = MOCK_RESULT;
  const gnomeState = gnomeStateForRisk(result.riskLevel);
  const showFindPro = result.riskLevel === 'moderate' || result.riskLevel === 'high';

  return (
    <ScreenContainer>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' }}
        style={styles.image}
        resizeMode="cover"
      />

      <Text variant="labelSmall" style={styles.scanned}>
        Scanned: {result.location}
      </Text>

      <View style={styles.riskRow}>
        <View>
          <Text variant="labelMedium" style={styles.label}>Overall Risk Level</Text>
          <View style={styles.riskBadgeRow}>
            <RiskBadge level={result.riskLevel} />
            <Text variant="headlineSmall" style={styles.pct}>{result.confidence}%</Text>
          </View>
        </View>
      </View>

      <ConfidenceBar percentage={result.confidence} />

      <View style={styles.gnomeSection}>
        <View style={styles.gnomeRow}>
          <GnomeAvatar state={gnomeState} size={64} />
          <View style={styles.bubble}>
            <Text variant="labelSmall" style={styles.gnomeName}>Inspector Gnome</Text>
            <Text variant="bodySmall" style={styles.explanation}>{result.explanation}</Text>
          </View>
        </View>
      </View>

      {showFindPro && (
        <Button
          mode="contained"
          buttonColor="#2E7D32"
          onPress={() => navigation.navigate('FindAPro', {})}
          contentStyle={styles.btnContent}
        >
          Find a Professional
        </Button>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  scanned: {
    color: '#B0B0B0',
    marginBottom: spacing.lg,
  },
  riskRow: {
    marginBottom: spacing.lg,
  },
  label: {
    color: '#B0B0B0',
    marginBottom: spacing.xs,
  },
  riskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  pct: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gnomeSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  gnomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bubble: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  gnomeName: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  explanation: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
  btnContent: {
    paddingVertical: spacing.sm,
  },
});
