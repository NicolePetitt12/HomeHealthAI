import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { ScreenContainer, RiskBadge, ConfidenceBar, GnomeAvatar } from '../components';
import { spacing, radii } from '../theme';
import { useAppSelector } from '../store/hooks';
import { supabase } from '../services/supabase';
import type { MainStackScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';
import type { GnomeState } from '../components';

type Props = MainStackScreenProps<'Results'>;

// TODO: Replace with real AI analysis data from backend pipeline
const MOCK_ANALYSIS = {
  riskLevel: 'moderate' as RiskLevel,
  confidence: 87,
  explanation:
    'I analyzed your photo and found some moisture staining on the wall surface. This often indicates humidity levels are too high or there is a small leak. I recommend checking your gutters and ensuring proper ventilation in this area.',
};

function gnomeStateForRisk(risk: RiskLevel): GnomeState {
  return risk === 'low' ? 'idle' : 'concern';
}

export function ResultsScreen({ navigation, route }: Props) {
  const { inspectionId } = route.params;
  const currentScan = useAppSelector((s) => s.inspection.currentScan);
  const scan = currentScan?.id === inspectionId ? currentScan : null;

  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!scan?.imagePath) return;
    supabase.storage
      .from('scan-images')
      .createSignedUrl(scan.imagePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setImageUri(data.signedUrl);
      });
  }, [scan?.imagePath]);

  const analysis = MOCK_ANALYSIS;
  const gnomeState = gnomeStateForRisk(analysis.riskLevel);
  const showFindPro = analysis.riskLevel === 'moderate' || analysis.riskLevel === 'high';

  return (
    <ScreenContainer>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator color="#2E7D32" />
        </View>
      )}

      <Text variant="labelSmall" style={styles.metaLabel}>Location</Text>
      <Text variant="bodySmall" style={styles.metaValue}>{scan?.location ?? 'Unknown location'}</Text>

      {scan?.notes ? (
        <>
          <Text variant="labelSmall" style={[styles.metaLabel, { marginTop: spacing.sm }]}>Notes</Text>
          <Text variant="bodySmall" style={styles.metaValue}>{scan.notes}</Text>
        </>
      ) : null}

      <View style={styles.riskRow}>
        <View>
          <Text variant="labelMedium" style={styles.label}>Overall Risk Level</Text>
          <View style={styles.riskBadgeRow}>
            <RiskBadge level={analysis.riskLevel} />
            <Text variant="headlineSmall" style={styles.pct}>{analysis.confidence}%</Text>
          </View>
        </View>
      </View>

      <ConfidenceBar percentage={analysis.confidence} />

      <View style={styles.gnomeSection}>
        <View style={styles.gnomeRow}>
          <GnomeAvatar state={gnomeState} size={64} />
          <View style={styles.bubble}>
            <Text variant="labelSmall" style={styles.gnomeName}>Inspector Gnome</Text>
            <Text variant="bodySmall" style={styles.explanation}>{analysis.explanation}</Text>
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
  imagePlaceholder: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    color: '#888888',
    marginBottom: 2,
  },
  metaValue: {
    color: '#E0E0E0',
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
