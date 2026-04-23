import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GnomeTip,
  SectionHeader,
  RiskDot,
  NextStepsPanel,
  ConfidenceBar,
  DisclaimerBanner,
} from '../components';
import { spacing, radii } from '../theme';
import { useAppSelector } from '../store/hooks';
import { supabase } from '../services/supabase';
import { useAnalysisResult } from '../hooks/useAnalysisResult';
import { getMockAnalysis } from './results/mockAnalysisData';
import type { MainStackScreenProps } from '../navigation/types';

type Props = MainStackScreenProps<'DetailedResults'>;

const PROFESSIONAL_LABELS: Record<string, string> = {
  inspector: 'Mold Inspector',
  remediation: 'Mold Remediation Specialist',
  plumber: 'Plumber',
  hvac: 'HVAC Technician',
};

export function DetailedResultsScreen({ navigation, route }: Props) {
  const { inspectionId, riskLevel: fallbackRiskLevel } = route.params;
  const currentScan = useAppSelector((s) => s.inspection.currentScan);
  const scan = currentScan?.id === inspectionId ? currentScan : null;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  useEffect(() => {
    async function loadImage() {
      // Use imagePath from Redux if available; otherwise fetch from DB
      let imagePath = scan?.imagePath ?? null;
      console.log('[DetailedResults] scan.imagePath from Redux:', imagePath);

      if (!imagePath) {
        console.log('[DetailedResults] Redux scan missing, querying DB for inspectionId:', inspectionId);
        const { data, error } = await supabase
          .from('scans')
          .select('image_path')
          .eq('id', inspectionId)
          .single();
        console.log('[DetailedResults] DB scan query result:', { image_path: data?.image_path, error: error?.message });
        imagePath = data?.image_path ?? null;
      }

      if (!imagePath) {
        console.log('[DetailedResults] No imagePath found, aborting image load');
        return;
      }

      console.log('[DetailedResults] Generating signed URL for path:', imagePath);
      const { data, error } = await supabase.storage
        .from('scan-images')
        .createSignedUrl(imagePath, 3600);
      console.log('[DetailedResults] Signed URL result:', { signedUrl: data?.signedUrl?.slice(0, 80) + '...', error: error?.message });

      if (data?.signedUrl) {
        // Decode percent-encoded brackets in IPv6 host (e.g. %5B → [ , %5D → ])
        // so the native Android Image downloader can parse the URL correctly.
        const safeUrl = data.signedUrl.replace(/%5B/gi, '[').replace(/%5D/gi, ']');
        setImageUri(safeUrl);
      } else {
        setImageError(`signedUrl error: ${error?.message ?? 'unknown'}`);
      }
    }
    loadImage().catch((e) => {
      console.log('[DetailedResults] loadImage threw:', String(e));
      setImageError(String(e));
    });
  }, [inspectionId, scan?.imagePath]);

  const { data: dbAnalysis, isLoading: analysisLoading } = useAnalysisResult(inspectionId);
  // Use real DB data when available; fall back to mock when the scan has no analysis row yet
  const analysis = dbAnalysis ?? (analysisLoading ? null : getMockAnalysis(fallbackRiskLevel ?? 'moderate'));

  const confidence = analysis ? analysis.confidence : 0;
  const professionalLabel = analysis?.suggestedProfessionalType
    ? PROFESSIONAL_LABELS[analysis.suggestedProfessionalType]
    : null;

  const scanDate = analysis
    ? new Date(analysis.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <ScreenContainer>
      {/* Image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onLoadStart={() => console.log('[DetailedResults] Image onLoadStart, uri:', imageUri.slice(0, 80))}
          onLoad={() => console.log('[DetailedResults] Image onLoad — success')}
          onError={(e) => {
            const msg = e.nativeEvent.error ?? 'unknown';
            console.log('[DetailedResults] Image onError:', msg, 'uri:', imageUri.slice(0, 80));
            setImageError(`Image load failed: ${msg}`);
          }}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          {imageError ? (
            <Text variant="bodySmall" style={{ color: '#FF6B6B', textAlign: 'center', padding: 8 }}>{imageError}</Text>
          ) : (
            <ActivityIndicator color="#C41E3A" />
          )}
        </View>
      )}
      {imageError && imageUri ? (
        <Text variant="bodySmall" style={{ color: '#FF6B6B', marginBottom: 8 }}>{imageError}</Text>
      ) : null}

      {/* Scan meta */}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="calendar" size={14} color="#888888" />
        <Text variant="labelSmall" style={styles.metaText}>
          Date of Scan: {scanDate}
        </Text>
      </View>
      {scan?.location && (
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color="#888888" />
          <Text variant="labelSmall" style={styles.metaText}>
            {scan.location}
          </Text>
        </View>
      )}

      {analysisLoading && !analysis ? (
        <ActivityIndicator color="#C41E3A" style={{ marginTop: spacing.xxl }} />
      ) : null}

      {analysis ? <>
        {/* Confidence */}
        <View style={styles.section}>
          <ConfidenceBar percentage={confidence} />
        </View>

        {/* Suspected Mold Type */}
        {analysis.suspectedMoldType && (
          <View style={styles.moldTypeCard}>
            <View style={styles.moldTypeHeader}>
              <MaterialCommunityIcons name="alert" size={18} color="#FFB74D" />
              <Text variant="bodyMedium" style={styles.moldTypeTitle}>
                Suspected Mold Type:{' '}
                <Text style={styles.moldTypeName}>{analysis.suspectedMoldType}</Text>
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.moldTypeDesc}>
              {analysis.suspectedMoldDescription}
            </Text>
            <Text variant="bodySmall" style={styles.moldTypeDisclaimer}>
              * Visual indicators consistent with {analysis.suspectedMoldType}. Confirmation
              requires professional testing.
            </Text>
          </View>
        )}

        {/* Result Summary */}
        <View style={styles.section}>
          <SectionHeader title="Results Summary" />
          <View style={styles.findingsCard}>
            {analysis.findings.map((finding, i) => (
              <View key={i} style={[styles.findingRow, i > 0 && styles.findingDivider]}>
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
                  {finding.location && (
                    <Text variant="labelSmall" style={styles.findingLocation}>
                      {finding.location}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Educational context */}
        <View style={styles.section}>
          <GnomeTip text="All homes have some level of mold spores — this is completely normal. What matters is whether the conditions allow them to grow. Focus on moisture control and ventilation to keep your home healthy." />
        </View>

        {/* Recommended Next Steps */}
        <View style={styles.section}>
          <SectionHeader title="Recommended Next Steps" />
          <NextStepsPanel steps={analysis.nextSteps} />
        </View>

        {/* Suggested Professional */}
        {professionalLabel && (
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
        )}
      </> : null}

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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaText: {
    color: '#888888',
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
  section: {
    marginTop: spacing.xl,
  },
  moldTypeCard: {
    backgroundColor: '#1C1212',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB74D',
  },
  moldTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  moldTypeTitle: {
    color: '#FFFFFF',
    flex: 1,
  },
  moldTypeName: {
    color: '#FFB74D',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  moldTypeDesc: {
    color: '#B0B0B0',
    lineHeight: 18,
  },
  moldTypeDisclaimer: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
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
  btnRescan: {
    backgroundColor: '#C41E3A',
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  btnRescanText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
