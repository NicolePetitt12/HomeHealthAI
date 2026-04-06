import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { GnomeTip, ProgressOverlay, AppBackground } from '../components';
import { useSubmitScan } from '../hooks/useSubmitScan';
import { spacing } from '../theme';
import type { MainStackScreenProps } from '../navigation/types';
import type { SubmitStage } from '../hooks/useSubmitScan';

type Props = MainStackScreenProps<'PhotoReview'>;

export function PhotoReviewScreen({ route, navigation }: Props) {
  const { imageUri } = route.params;
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
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
    try {
      const scan = await submitScan.mutateAsync({
        imageUri,
        location: location.trim(),
        notes: notes.trim() || null,
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
});
