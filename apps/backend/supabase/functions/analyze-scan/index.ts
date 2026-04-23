import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/notify.ts';
import { extractFeatures } from './vision/extractFeatures.ts';
import { buildTriageInput } from './mappers/buildTriageInput.ts';
import { runTriage } from './engine/runTriage.ts';
import { toAnalysisRow } from './mappers/toAnalysisRow.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

type YesNoUnknown = 'yes' | 'no' | 'unknown';

interface ScanRecord {
  id: string;
  user_id: string;
  image_path: string;
  location: string;
  notes: string | null;
  status: string;
  recurring_issue: YesNoUnknown;
  musty_odor_present: YesNoUnknown;
  recent_water_event: YesNoUnknown;
  occupant_symptoms_reported: YesNoUnknown;
  humidity_percent: number | null;
  temperature_f: number | null;
}

// ─── Image helpers ────────────────────────────────────────────────────────────

// Process in 8 KB chunks to avoid call-stack overflow on large images.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

async function downloadImageAsDataUrl(signedUrl: string): Promise<string> {
  console.log('[analyze-scan] fetching image:', signedUrl.split('?')[0]);
  const resp = await fetch(signedUrl);
  if (!resp.ok) throw new Error(`Failed to fetch scan image: ${resp.status} ${resp.statusText}`);
  const bytes = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') ?? 'image/jpeg';
  console.log(`[analyze-scan] image downloaded: ${(bytes.byteLength / 1024).toFixed(1)} KB, type=${contentType}`);
  return `data:${contentType};base64,${arrayBufferToBase64(bytes)}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let scan: ScanRecord;

  try {
    const body = await req.json();
    scan = body.record as ScanRecord;
    if (!scan?.id) {
      return new Response(JSON.stringify({ error: 'Missing scan record in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Enforce scan quota (server-side defense) + fetch user sensitivity
  const SCAN_LIMITS: Record<string, number> = { free: 3, home: 20, pro: -1 };
  const [{ data: planTier }, { data: scanCount }, { data: profile }] = await Promise.all([
    supabase.rpc('get_user_plan_tier', { p_user_id: scan.user_id }),
    supabase.rpc('get_monthly_scan_count', { p_user_id: scan.user_id }),
    supabase.from('profiles').select('occupant_sensitivity').eq('id', scan.user_id).single(),
  ]);
  const tier: string = planTier ?? 'free';
  const count: number = scanCount ?? 0;
  const limit = SCAN_LIMITS[tier] ?? 3;
  if (limit !== -1 && count > limit) {
    await supabase.from('scans').update({ status: 'failed' }).eq('id', scan.id);
    return new Response(JSON.stringify({ error: 'Scan quota exceeded' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Mark scan as processing
  await supabase.from('scans').update({ status: 'processing' }).eq('id', scan.id);

  try {
    // 3. Get signed URL (60 s TTL — used immediately)
    const { data: urlData } = await supabase.storage
      .from('scan-images')
      .createSignedUrl(scan.image_path, 60);
    if (!urlData?.signedUrl) throw new Error('Could not generate signed URL for scan image');

    // 4. Download image and convert to base64 data URL
    const imageDataUrl = await downloadImageAsDataUrl(urlData.signedUrl);

    // 5. Extract visual features via LLM
    const features = await extractFeatures(imageDataUrl, {
      location: scan.location,
      notes: scan.notes,
    });

    // 6. Build the 30-field triage input (visual + P1 context overrides)
    const overrides: Partial<TriageInput> = {
      recurring_issue:            scan.recurring_issue ?? 'unknown',
      musty_odor_present:         scan.musty_odor_present ?? 'unknown',
      recent_water_event:         scan.recent_water_event ?? 'unknown',
      occupant_symptoms_reported: scan.occupant_symptoms_reported ?? 'unknown',
      occupant_sensitivity:       (profile as { occupant_sensitivity?: string } | null)?.occupant_sensitivity ?? 'unknown',
      humidity_percent:           scan.humidity_percent ?? null,
      temperature_f:              scan.temperature_f ?? null,
    };
    const triageInput = buildTriageInput(scan, features, overrides);

    // 7. Run deterministic vNext.1 engine (Steps 1-6)
    const triageOutput = runTriage(triageInput);
    console.log(
      `[analyze-scan] triage complete: action=${triageOutput.final.final_action_code}, risk_band=${triageOutput.iaq.risk_band}, gate=${triageOutput.final.review_gate_triggered}`,
    );

    // 8. Map triage output to analysis_results row (UI-facing columns + payload)
    const analysisRow = toAnalysisRow(triageOutput, features);

    // 9. Upsert analysis result (idempotent)
    const { error: insertError } = await supabase.from('analysis_results').upsert(
      { scan_id: scan.id, model_version: 'vNext.1+gpt-4o', ...analysisRow },
      { onConflict: 'scan_id' },
    );
    if (insertError) throw insertError;

    // 10. Mark scan completed + notify
    await supabase.from('scans').update({ status: 'completed' }).eq('id', scan.id);
    await sendNotification(supabase, {
      userId: scan.user_id,
      type: 'scan_completed',
      title: 'Scan Complete',
      body: `Your scan of "${scan.location || 'your area'}" is ready. Tap to view results.`,
      data: { scanId: scan.id, screen: 'Results' },
    });

    return new Response(JSON.stringify({ success: true, scanId: scan.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await supabase.from('scans').update({ status: 'failed' }).eq('id', scan.id);
    console.error('[analyze-scan] error:', err);
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
