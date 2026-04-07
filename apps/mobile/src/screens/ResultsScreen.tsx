import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import {
  ScreenContainer,
  GnomeAvatar,
  GnomeTip,
  SectionHeader,
  RiskDot,
  ConcernLevelCard,
  NextStepsPanel,
  DisclaimerBanner,
} from '../components';
import { spacing, radii } from '../theme';
import { useAppSelector } from '../store/hooks';
import { supabase } from '../services/supabase';
import { useAnalysisResult } from '../hooks/useAnalysisResult';
import { getMockAnalysis } from './results/mockAnalysisData';
import type { MainStackScreenProps } from '../navigation/types';
import type { RiskLevel } from '@inspector-gnome/shared';
import type { GnomeState } from '../components';

type Props = MainStackScreenProps<'Results'>;

const PROFESSIONAL_LABELS: Record<string, string> = {
  inspector: 'Mold Inspector',
  remediation: 'Mold Remediation Specialist',
  plumber: 'Plumber',
  hvac: 'HVAC Technician',
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

  const { data: realAnalysis } = useAnalysisResult(scan?.id);

  // After 30s with no result from DB, fall back to mock data so the screen doesn't hang.
  // This covers the case where the Edge Function webhook isn't set up yet.
  const [analysisTimedOut, setAnalysisTimedOut] = useState(false);
  useEffect(() => {
    if (realAnalysis) return;
    const t = setTimeout(() => setAnalysisTimedOut(true), 30_000);
    return () => clearTimeout(t);
  }, [realAnalysis]);

  const isProcessing = !realAnalysis && !analysisTimedOut;

  // Use real analysis from DB when available; fall back to mock while processing or after timeout
  const analysis = realAnalysis
    ? {
        ...realAnalysis,
        likelyIssue: getMockAnalysis(realAnalysis.riskLevel).likelyIssue,
        suggestedProfessionalType: getMockAnalysis(realAnalysis.riskLevel)
          .suggestedProfessionalType,
      }
    : getMockAnalysis('moderate');
  const confidence = Math.round(analysis.confidence * 100);
  const gnomeState: GnomeState = isProcessing ? 'analyzing' : gnomeStateForRisk(analysis.riskLevel);
  const professionalLabel = analysis.suggestedProfessionalType
    ? PROFESSIONAL_LABELS[analysis.suggestedProfessionalType]
    : null;

  return (
    <ScreenContainer>
      {/* 1. Image preview */}
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ActivityIndicator color="#C41E3A" />
        </View>
      )}

      {/* 2. Location + Notes */}
      <Text variant="labelSmall" style={styles.metaLabel}>
        Location
      </Text>
      <Text variant="bodySmall" style={styles.metaValue}>
        {scan?.location ?? 'Unknown location'}
      </Text>
      {scan?.notes ? (
        <>
          <Text variant="labelSmall" style={[styles.metaLabel, { marginTop: spacing.sm }]}>
            Notes
          </Text>
          <Text variant="bodySmall" style={styles.metaValue}>
            {scan.notes}
          </Text>
        </>
      ) : null}

      {/* Processing state */}
      {isProcessing ? (
        <View style={styles.section}>
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
        </View>
      ) : (
        <>
          {/* 3. Likely Issue */}
          <View style={styles.section}>
            <SectionHeader title="What We Found" />
            <Text variant="titleLarge" style={styles.likelyIssue}>
              {analysis.likelyIssue}
            </Text>
          </View>

          {/* 6. Educational context */}
          <View style={styles.section}>
            <GnomeTip text="All homes have some level of mold spores — this is completely normal. What matters is whether the conditions allow them to grow. Focus on moisture control and ventilation to keep your home healthy." />
          </View>

          {/* 7. Detailed Findings */}
          <View style={styles.section}>
            <SectionHeader title="Detailed Findings" />
            <View style={styles.findingsCard}>
              {analysis.findings.map((finding, index) => (
                <View key={index} style={[styles.findingRow, index > 0 && styles.findingDivider]}>
                  <View style={styles.findingLeft}>
                    {finding.severity ? (
                      <RiskDot level={finding.severity} size={10} />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </View>
                  <View style={styles.findingBody}>
                    <Text variant="labelMedium" style={styles.findingType}>
                      {finding.type}
                    </Text>
                    <Text variant="bodySmall" style={styles.findingDesc}>
                      {finding.description}
                    </Text>
                    {finding.location ? (
                      <Text variant="labelSmall" style={styles.findingLocation}>
                        {finding.location}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 8. Next Steps */}
          <View style={styles.section}>
            <SectionHeader title="Recommended Next Steps" />
            <NextStepsPanel steps={analysis.nextSteps} />
          </View>

          {/* 9. Suggested professional (conditional) */}
          {professionalLabel ? (
            <View style={styles.section}>
              <SectionHeader title="Suggested Professional" />
              <View style={styles.proCard}>
                <Text variant="bodyMedium" style={styles.proText}>
                  Based on what I found, we recommend consulting a{' '}
                  <Text style={styles.proHighlight}>{professionalLabel}</Text> for a thorough
                  assessment.
                </Text>
                <Button
                  mode="contained"
                  buttonColor="#C41E3A"
                  onPress={() => navigation.navigate('FindAPro', {})}
                  contentStyle={styles.btnContent}
                  style={styles.btn}
                >
                  Find a Professional
                </Button>
              </View>
            </View>
          ) : null}
        </>
      )}

      {/* 10. Disclaimer — always visible */}
      <View style={styles.section}>
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
  metaLabel: {
    color: '#888888',
    marginBottom: 2,
  },
  metaValue: {
    color: '#E0E0E0',
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
  },
  processingCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
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
  likelyIssue: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  gnomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  gnomeTipWrap: {
    flex: 1,
  },
  findingsCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  findingRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  findingDivider: {
    borderTopWidth: 1,
    borderTopColor: '#2A1A1A',
  },
  findingLeft: {
    width: 16,
    alignItems: 'center',
    paddingTop: 3,
  },
  dotPlaceholder: {
    width: 10,
    height: 10,
  },
  findingBody: {
    flex: 1,
    gap: 2,
  },
  findingType: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  findingDesc: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
  findingLocation: {
    color: '#666666',
    marginTop: 2,
  },
  proCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  proText: {
    color: '#B0B0B0',
    lineHeight: 20,
  },
  proHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  btn: {
    borderRadius: radii.sm,
  },
  btnContent: {
    paddingVertical: spacing.sm,
  },
});
