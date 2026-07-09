import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { supabase } from './supabase';
import type { Scan, YesNoUnknown } from '@inspector-gnome/shared';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_WIDTH = 1920;

// ─── Compress ────────────────────────────────────────────────────────────────

export async function compressImage(uri: string): Promise<{ uri: string; fileSize: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );

  const fileSize = new File(result.uri).size ?? 0;

  if (fileSize > MAX_SIZE_BYTES) {
    const recompressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
    );
    return {
      uri: recompressed.uri,
      fileSize: new File(recompressed.uri).size ?? 0,
    };
  }

  return { uri: result.uri, fileSize };
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export async function uploadScanImage(userId: string, imageUri: string): Promise<string> {
  const path = `${userId}/${Date.now()}.jpg`;

  const buffer = await new File(imageUri).arrayBuffer();

  const { error } = await supabase.storage
    .from('scan-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return path;
}

// ─── Create Scan Record ───────────────────────────────────────────────────────

export interface ScanContextInput {
  recurringIssue: YesNoUnknown;
  mustyOdorPresent: YesNoUnknown;
  recentWaterEvent: YesNoUnknown;
  occupantSymptomsReported: YesNoUnknown;
  humidityPercent: number | null;
  temperatureF: number | null;
}

export async function createScanRecord(
  userId: string,
  imagePath: string,
  location: string,
  notes: string | null,
  context: ScanContextInput,
): Promise<Scan> {
  const { data, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      image_path: imagePath,
      location,
      notes,
      status: 'pending',
      recurring_issue: context.recurringIssue,
      musty_odor_present: context.mustyOdorPresent,
      recent_water_event: context.recentWaterEvent,
      occupant_symptoms_reported: context.occupantSymptomsReported,
      humidity_percent: context.humidityPercent,
      temperature_f: context.temperatureF,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create scan: ${error.message}`);

  return {
    id: data.id,
    userId: data.user_id,
    imagePath: data.image_path,
    location: data.location,
    notes: data.notes,
    status: data.status,
    recurringIssue: data.recurring_issue,
    mustyOdorPresent: data.musty_odor_present,
    recentWaterEvent: data.recent_water_event,
    occupantSymptomsReported: data.occupant_symptoms_reported,
    humidityPercent: data.humidity_percent ?? null,
    temperatureF: data.temperature_f ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ─── Trigger Analysis ─────────────────────────────────────────────────────────
// Directly invoke the Edge Function instead of relying on the pg_net trigger,
// which requires a separate `supabase functions serve` process to be running.

export async function triggerAnalysis(scan: Scan): Promise<void> {
  const { error } = await supabase.functions.invoke('analyze-scan', {
    body: { scan_id:  scan.id },

  });
  if (error) throw error;
}
