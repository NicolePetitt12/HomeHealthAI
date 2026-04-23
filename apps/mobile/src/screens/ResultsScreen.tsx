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
    category: categoryForRisk(realAnalysis.riskLevel),
    likelyIssue: realAnalysis.likelyIssue ?? mock.likelyIssue,
    description: realAnalysis.description ?? mock.description,
    recommendationTitle: realAnalysis.recommendationTitle ?? mock.recommendationTitle,
    recommendations: realAnalysis.recommendations ?? mock.recommendations,
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

const REJECTION_COPY: Record<string, { title: string; message: string }> = {
  low_quality: {
    title: 'Image Too Unclear',
    message: 'The photo was too blurry or dark to analyze. Try again with better lighting and hold the camera steady.',
  },
  non_mold: {
    title: 'No Surface Detected',
    message: "I couldn't identify any mold-related content in this photo. Try a closer shot of the suspect area on a wall, ceiling, or floor.",
  },
  out_of_scope: {
    title: 'Outside My Scope',
    message: 'This photo is outside what I can analyze. I work best on indoor surfaces like walls, ceilings, and areas where mold might grow.',
  },
};

export function ResultsScreen({ navigation, route }: Props) {
  const { inspectionId } = route.params;
  const currentScan = useAppSelector((s) => s.inspection.currentScan);
  const scan = currentScan?.id === inspectionId ? currentScan : null;

  const [imageUri, setImageUri] = useState<string | null>(null);
  useEffect(() => {
    async function loadImage() {
      let imagePath = scan?.imagePath ?? null;
      if (!imagePath) {
        const { data } = await supabase
          .from('scans')
          .select('image_path')
          .eq('id', inspectionId)
          .single();
        imagePath = data?.image_path ?? null;
      }
      if (!imagePath) return;
      const { data } = await supabase.storage
        .from('scan-images')
        .createSignedUrl(imagePath, 3600);
      // Decode percent-encoded IPv6 brackets (%5B → [ , %5D → ]) so the native
      // Android Image downloader can parse the host correctly.
      if (data?.signedUrl) setImageUri(data.signedUrl.replace(/%5B/gi, '[').replace(/%5D/gi, ']'));
    }
    loadImage();
  }, [inspectionId, scan?.imagePath]);

  const { data: realAnalysis } = useAnalysisResult(scan?.id ?? inspectionId);
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
    : analysis.category === 'clean_mold_safely' ? 'noMold'
    : analysis.category === 'inconclusive' ? 'inconclusive'
    : 'concern';

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

          {/* Rejection banner (replaces recommendations when image was rejected) */}
          {analysis.rejectionReason ? (
            <View style={styles.rejectionCard}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color="#FFB74D" style={styles.rejectionIcon} />
              <Text variant="titleSmall" style={styles.rejectionTitle}>
                {REJECTION_COPY[analysis.rejectionReason]?.title ?? 'Scan Could Not Be Analyzed'}
              </Text>
              <Text variant="bodyMedium" style={styles.rejectionMessage}>
                {REJECTION_COPY[analysis.rejectionReason]?.message ?? 'Please try again with a clearer image.'}
              </Text>
            </View>
          ) : (
            /* Recommendations */
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
          )}

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
            {!analysis.rejectionReason && (
              <TouchableOpacity
                style={styles.btnLearnMore}
                onPress={() => navigation.navigate('DetailedResults', { inspectionId, riskLevel: analysis.riskLevel })}
                activeOpacity={0.85}
              >
                <Text variant="labelLarge" style={styles.btnLearnMoreText}>Learn More</Text>
              </TouchableOpacity>
            )}
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
  rejectionCard: {
    backgroundColor: '#1C1810',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#3A3020',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  rejectionIcon: {
    marginBottom: spacing.xs,
  },
  rejectionTitle: {
    color: '#FFB74D',
    fontWeight: '700',
    textAlign: 'center',
  },
  rejectionMessage: {
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
