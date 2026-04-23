import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { GnomeTip, ProgressOverlay, AppBackground, FilterChipRow } from '../components';
import { useSubmitScan } from '../hooks/useSubmitScan';
import { spacing } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';
import type { SubmitStage } from '../hooks/useSubmitScan';
import type { YesNoUnknown } from '@inspector-gnome/shared';

type Props = MainStackScreenProps<'PhotoReview'>;

function parseOptionalNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

const YNQ_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Unknown', value: 'unknown' },
];

export function PhotoReviewScreen({ route, navigation }: Props) {
  const { imageUri, prefillLocation, prefillNotes } = route.params;
  const [location, setLocation] = useState(prefillLocation ?? '');
  const [notes, setNotes] = useState(prefillNotes ?? '');
  const [recurringIssue, setRecurringIssue] = useState<YesNoUnknown>('unknown');
  const [mustyOdorPresent, setMustyOdorPresent] = useState<YesNoUnknown>('unknown');
  const [recentWaterEvent, setRecentWaterEvent] = useState<YesNoUnknown>('unknown');
  const [occupantSymptomsReported, setOccupantSymptomsReported] = useState<YesNoUnknown>('unknown');
  const [humidityText, setHumidityText] = useState('');
  const [temperatureText, setTemperatureText] = useState('');
  const [progressVisible, setProgressVisible] = useState(false);
  const [stage, setStage] = useState<SubmitStage>('compressing');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submitScan = useSubmitScan(({ stage, percent }) => {
    setStage(stage);
    setPercent(percent);
  });

  async function handleSubmit() {
    if (!location.trim()) return;
    setError(null);
    setProgressVisible(true);
    const rawHumidity = parseOptionalNumber(humidityText);
    const humidityPercent =
      rawHumidity !== null && rawHumidity >= 0 && rawHumidity <= 100 ? rawHumidity : null;
    const temperatureF = parseOptionalNumber(temperatureText);
    try {
      const scan = await submitScan.mutateAsync({
        imageUri,
        location: location.trim(),
        notes: notes.trim() || null,
        recurringIssue,
        mustyOdorPresent,
        recentWaterEvent,
        occupantSymptomsReported,
        humidityPercent,
        temperatureF,
      });
      navigation.replace('Results', { inspectionId: scan.id });
    } catch (err) {
      setProgressVisible(false);
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    }
  }

  function handleRetake() {
    navigation.goBack();
  }

  return (
    <AppBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBanner}>
              <Text variant="bodySmall" style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleSubmit}>
                <Text variant="labelSmall" style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            label="Location (required)"
            placeholder="e.g., Basement - West Wall"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            textColor="#FFFFFF"
            placeholderTextColor="#888"
            outlineColor="#333"
            activeOutlineColor="#C41E3A"
            style={styles.input}
            theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0B0B0' } }}
          />

          <TextInput
            label="Notes (optional)"
            placeholder="Any additional details about this area..."
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
            textColor="#FFFFFF"
            placeholderTextColor="#888"
            outlineColor="#333"
            activeOutlineColor="#C41E3A"
            style={[styles.input, styles.notesInput]}
            theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0B0B0' } }}
          />

          <View style={styles.contextSection}>
            <Text variant="labelMedium" style={styles.contextTitle}>Help us interpret the photo</Text>
            <Text variant="bodySmall" style={styles.contextSubtitle}>Optional — tap to answer</Text>

            <Text variant="bodySmall" style={styles.questionLabel}>
              Has this issue appeared in this area before?
            </Text>
            <FilterChipRow
              options={YNQ_OPTIONS}
              selected={recurringIssue}
              onSelect={(v) => setRecurringIssue(v as YesNoUnknown)}
            />

            <Text variant="bodySmall" style={styles.questionLabel}>
              Do you notice a musty or earthy smell in this area?
            </Text>
            <FilterChipRow
              options={YNQ_OPTIONS}
              selected={mustyOdorPresent}
              onSelect={(v) => setMustyOdorPresent(v as YesNoUnknown)}
            />

            <Text variant="bodySmall" style={styles.questionLabel}>
              Has there been a leak, flood, or water buildup recently?
            </Text>
            <FilterChipRow
              options={YNQ_OPTIONS}
              selected={recentWaterEvent}
              onSelect={(v) => setRecentWaterEvent(v as YesNoUnknown)}
            />

            <Text variant="bodySmall" style={styles.questionLabel}>
              Has anyone in the home reported respiratory or allergy symptoms?
            </Text>
            <FilterChipRow
              options={YNQ_OPTIONS}
              selected={occupantSymptomsReported}
              onSelect={(v) => setOccupantSymptomsReported(v as YesNoUnknown)}
            />

            <Text variant="bodySmall" style={styles.questionLabel}>
              Relative humidity (%) — optional
            </Text>
            <TextInput
              value={humidityText}
              onChangeText={setHumidityText}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g., 55"
              textColor="#FFFFFF"
              placeholderTextColor="#888"
              outlineColor="#333"
              activeOutlineColor="#C41E3A"
              style={styles.numericInput}
              theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0B0B0' } }}
            />
            <Text variant="bodySmall" style={styles.helperText}>
              Skip if you don't have a hygrometer.
            </Text>

            <Text variant="bodySmall" style={styles.questionLabel}>
              Ambient temperature (°F) — optional
            </Text>
            <TextInput
              value={temperatureText}
              onChangeText={setTemperatureText}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g., 72"
              textColor="#FFFFFF"
              placeholderTextColor="#888"
              outlineColor="#333"
              activeOutlineColor="#C41E3A"
              style={styles.numericInput}
              theme={{ colors: { background: '#1C1212', onSurfaceVariant: '#B0B0B0' } }}
            />
          </View>

          <GnomeTip text="Describe where this photo was taken so you can find it later." />

          <TouchableOpacity
            style={[styles.submitBtn, !location.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!location.trim() || submitScan.isPending}
          >
            <Text variant="labelLarge" style={styles.submitBtnText}>Submit for Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Text variant="labelMedium" style={styles.retakeBtnText}>
              {route.params.source === 'gallery' ? 'Choose Different Photo' : 'Retake Photo'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProgressOverlay visible={progressVisible} stage={stage} percent={percent} />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 40,
  },
  preview: {
    width: '100%',
    height: 280,
    backgroundColor: '#1A1A1A',
  },
  form: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorBanner: {
    backgroundColor: '#4A1C1C',
    borderRadius: 8,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    flex: 1,
  },
  retryText: {
    color: '#FF6B6B',
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  input: {
    backgroundColor: '#1C1212',
  },
  notesInput: {
    minHeight: 80,
  },
  submitBtn: {
    backgroundColor: '#C41E3A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#FFFFFF',
  },
  retakeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  retakeBtnText: {
    color: '#B0B0B0',
  },
  contextSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  contextTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contextSubtitle: {
    color: '#666666',
    marginTop: -spacing.xs,
  },
  questionLabel: {
    color: '#B0B0B0',
    marginTop: spacing.sm,
  },
  numericInput: {
    backgroundColor: '#1C1212',
  },
  helperText: {
    color: '#666666',
    marginTop: -spacing.xs,
  },
});
