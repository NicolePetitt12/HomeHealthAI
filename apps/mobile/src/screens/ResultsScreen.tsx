import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer, GnomeAvatar, DisclaimerBanner } from '../components';
import { spacing, radii } from '../theme';
import { useAppSelector } from '../store/hooks';
import { supabase } from '../services/supabase';
import { useAnalysisResult } from '../hooks/useAnalysisResult';
import { getMockAnalysis, categoryForRisk } from './results/mockAnalysisData';
import type { MainStackScreenProps } from '../navigation/types';
import type { GnomeState } from '../components';
import type { ResultsViewData } from './results/mockAnalysisData';

type Props = MainStackScreenProps<'Results'>;

function buildViewData(
  realAnalysis: NonNullable<ReturnType<typeof useAnalysisResult>['data']>,
): ResultsViewData {
  const mock = getMockAnalysis(realAnalysis.riskLevel);
  return {
    ...realAnalysis,
    likelyIssue: mock.likelyIssue,
    suggestedProfessionalType: mock.suggestedProfessionalType,
    category: categoryForRisk(realAnalysis.riskLevel),
    description: mock.description,
    recommendationTitle: mock.recommendationTitle,
    recommendations: mock.recommendations,
    suspectedMoldType: mock.suspectedMoldType,
    suspectedMoldDescription: mock.suspectedMoldDescription,
  };
}

const TITLE_COLORS: Record<string, string> = {
  mold_suspected: '#FF6B6B',
  inconclusive: '#FFB74D',
  clean_mold_safely: '#81C784',
};

const TITLE_ICONS: Record<string, string> = {
  mold_suspected: 'alert',
  inconclusive: 'help-circle',
  clean_mold_safely: 'spray-bottle',
};

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
      .then(({ data }) => { if (data?.signedUrl) setImageUri(data.signedUrl); });
  }, [scan?.imagePath]);

  const { data: realAnalysis } = useAnalysisResult(scan?.id);
  const [analysisTimedOut, setAnalysisTimedOut] = useState(false);
  useEffect(() => {
    if (realAnalysis) return;
    const t = setTimeout(() => setAnalysisTimedOut(true), 5_000);
    return () => clearTimeout(t);
  }, [realAnalysis]);

  const isProcessing = !realAnalysis && !analysisTimedOut;
  const analysis: ResultsViewData = realAnalysis
    ? buildViewData(realAnalysis)
    : getMockAnalysis('moderate');

  const gnomeState: GnomeState = isProcessing ? 'analyzing'
    : analysis.riskLevel === 'low' ? 'idle' : 'concern';

  const titleColor = TITLE_COLORS[analysis.category] ?? '#FFFFFF';
  const titleIcon = TITLE_ICONS[analysis.category] ?? 'information';

  return (
    <ScreenContainer>
      {/* Scanned image */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator color="#C41E3A" />
        </View>
      )}

      {/* Processing */}
      {isProcessing ? (
        <View style={styles.processingCard}>
          <GnomeAvatar state="analyzing" size={72} />
          <Text variant="titleMedium" style={styles.processingTitle}>
            Analyzing your photo…
          </Text>
          <Text variant="bodySmall" style={styles.processingText}>
            Inspector Gnome is reviewing the image. This usually takes a few seconds.
          </Text>
          <ActivityIndicator color="#C41E3A" style={{ marginTop: spacing.md }} />
        </View>
      ) : (
        <>
          {/* Gnome + headline */}
          <View style={styles.resultHeader}>
            <GnomeAvatar state={gnomeState} size={80} />
            <View style={styles.titleWrap}>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons name={titleIcon as never} size={20} color={titleColor} />
                <Text style={[styles.resultTitle, { color: titleColor }]}>
                  {analysis.likelyIssue}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.resultDesc}>
                {analysis.description}
              </Text>
            </View>
          </View>

          {/* Recommendations */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.recTitle}>
              {analysis.recommendationTitle}
            </Text>
            {analysis.recommendations.map((rec, i) => (
              <View key={i} style={styles.recRow}>
                <MaterialCommunityIcons name="minus" size={16} color="#B0B0B0" style={styles.bullet} />
                <Text variant="bodyMedium" style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.btnRescan}
              onPress={() => navigation.replace('StartScan', {
                prefillLocation: scan?.location ?? undefined,
                prefillNotes: scan?.notes ?? undefined,
              })}
              activeOpacity={0.85}
            >
              <Text variant="labelLarge" style={styles.btnRescanText}>Rescan Area</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnLearnMore}
              onPress={() => navigation.navigate('DetailedResults', { inspectionId, riskLevel: analysis.riskLevel })}
              activeOpacity={0.85}
            >
              <Text variant="labelLarge" style={styles.btnLearnMoreText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <DisclaimerBanner />
      </View>
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
  processingCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  processingTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  processingText: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 18,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  titleWrap: {
    flex: 1,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  resultDesc: {
    color: '#B0B0B0',
    lineHeight: 20,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  recTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  bullet: {
    marginTop: 3,
  },
  recText: {
    color: '#B0B0B0',
    flex: 1,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btnRescan: {
    flex: 1,
    backgroundColor: '#C41E3A',
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnRescanText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnLearnMore: {
    flex: 1,
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A2020',
  },
  btnLearnMoreText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
