import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendNotification } from '../_shared/notify.ts';
import { extractFeatures } from './vision/extractFeatures.ts';
import { buildTriageInput } from './mappers/buildTriageInput.ts';
import { runTriage } from './engine/runTriage.ts';
import { toAnalysisRow } from './mappers/toAnalysisRow.ts';
import type { TriageInput } from './types.ts';

type YesNoUnknown = 'yes' | 'no' | 'unknown';
type OccupantSensitivity = 'standard' | 'sensitive' | 'highly_sensitive' | 'unknown';
type SupabaseAdmin = ReturnType<typeof createClient>;
type AuthContext = { kind: 'internal' } | { kind: 'user'; userId: string };

interface ScanRecord {
  id: string;
  user_id: string;
  image_path: string;
  location: string;
  notes: string | null;
  recurring_issue: YesNoUnknown;
  musty_odor_present: YesNoUnknown;
  recent_water_event: YesNoUnknown;
  occupant_symptoms_reported: YesNoUnknown;
  humidity_percent: number | null;
  temperature_f: number | null;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const INTERNAL_SECRET_HEADER = 'x-internal-function-secret';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SCAN_LIMITS: Record<string, number> = { free: 3, home: 20, pro: -1 };
const OCCUPANT_SENSITIVITY_VALUES = new Set<string>([
  'standard',
  'sensitive',
  'highly_sensitive',
  'unknown',
]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createAdminClient(): SupabaseAdmin {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, 'Server is missing Supabase service configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function timingSafeEqual(a: string | null, b: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function normalizeOccupantSensitivity(value: unknown): OccupantSensitivity {
  return typeof value === 'string' && OCCUPANT_SENSITIVITY_VALUES.has(value)
    ? (value as OccupantSensitivity)
    : 'unknown';
}

async function authenticateRequest(req: Request, supabase: SupabaseAdmin): Promise<AuthContext> {
  const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
  const providedInternalSecret = req.headers.get(INTERNAL_SECRET_HEADER);

  if (timingSafeEqual(providedInternalSecret, internalSecret ?? null)) {
    return { kind: 'internal' };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing Authorization bearer token');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, 'Invalid or expired Authorization token');
  }

  return { kind: 'user', userId: data.user.id };
}

async function parseRequestBody(req: Request): Promise<{ scanId: string }> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const payload = body as Record<string, unknown>;
  const keys = Object.keys(payload);

  if (keys.length !== 1 || !Object.prototype.hasOwnProperty.call(payload, 'scan_id')) {
    throw new HttpError(400, 'Request body must contain only scan_id');
  }

  const scanId = payload.scan_id;
  if (typeof scanId !== 'string' || !UUID_RE.test(scanId)) {
    throw new HttpError(400, 'scan_id must be a valid UUID string');
  }

  return { scanId };
}

async function fetchScan(supabase: SupabaseAdmin, scanId: string): Promise<ScanRecord> {
  const { data, error } = await supabase
    .from('scans')
    .select(`
      id,
      user_id,
      image_path,
      location,
      notes,
      recurring_issue,
      musty_odor_present,
      recent_water_event,
      occupant_symptoms_reported,
      humidity_percent,
      temperature_f
    `)
    .eq('id', scanId)
    .maybeSingle();

  if (error) {
    console.error('[analyze-scan] failed to fetch scan:', error);
    throw new HttpError(500, 'Failed to fetch scan');
  }

  if (!data) {
    throw new HttpError(404, 'Scan not found');
  }

  return data as ScanRecord;
}

function assertImagePathBelongsToScan(scan: ScanRecord): void {
  const expectedPrefix = `${scan.user_id}/`;
  const imagePath = scan.image_path;

  if (
    !imagePath ||
    imagePath.startsWith('/') ||
    imagePath.includes('..') ||
    imagePath.includes('\\') ||
    !imagePath.startsWith(expectedPrefix)
  ) {
    throw new HttpError(400, 'Scan image path does not belong to the scan owner');
  }
}

async function updateScanStatus(
  supabase: SupabaseAdmin,
  scanId: string,
  status: 'processing' | 'completed' | 'failed',
  required = false,
): Promise<void> {
  const { error } = await supabase.from('scans').update({ status }).eq('id', scanId);
  if (error) {
    console.error(`[analyze-scan] failed to mark scan ${status}:`, error);
    if (required) throw new HttpError(500, `Failed to mark scan ${status}`);
  }
}

async function fetchPlanContext(
  supabase: SupabaseAdmin,
  userId: string,
): Promise<{ tier: string; count: number; occupantSensitivity: OccupantSensitivity }> {
  const [planResult, countResult, profileResult] = await Promise.all([
    supabase.rpc('get_user_plan_tier', { p_user_id: userId }),
    supabase.rpc('get_monthly_scan_count', { p_user_id: userId }),
    supabase.from('profiles').select('occupant_sensitivity').eq('id', userId).maybeSingle(),
  ]);

  if (planResult.error || countResult.error || profileResult.error) {
    console.error('[analyze-scan] failed to verify plan context:', {
      planError: planResult.error,
      countError: countResult.error,
      profileError: profileResult.error,
    });
    throw new HttpError(500, 'Failed to verify scan entitlement');
  }

  return {
    tier: typeof planResult.data === 'string' ? planResult.data : 'free',
    count: typeof countResult.data === 'number' ? countResult.data : 0,
    occupantSensitivity: normalizeOccupantSensitivity(
      (profileResult.data as { occupant_sensitivity?: unknown } | null)?.occupant_sensitivity,
    ),
  };
}

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
  if (!resp.ok) throw new HttpError(502, `Failed to fetch scan image: ${resp.status} ${resp.statusText}`);
  const bytes = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') ?? 'image/jpeg';
  console.log(`[analyze-scan] image downloaded: ${(bytes.byteLength / 1024).toFixed(1)} KB, type=${contentType}`);
  return `data:${contentType};base64,${arrayBufferToBase64(bytes)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let supabase: SupabaseAdmin | null = null;
  let scan: ScanRecord | null = null;
  let markFailedOnError = false;

  try {
    supabase = createAdminClient();
    const auth = await authenticateRequest(req, supabase);
    const { scanId } = await parseRequestBody(req);

    scan = await fetchScan(supabase, scanId);

    if (auth.kind === 'user' && scan.user_id !== auth.userId) {
      throw new HttpError(403, 'Scan does not belong to the authenticated user');
    }

    markFailedOnError = true;
    assertImagePathBelongsToScan(scan);

    const { tier, count, occupantSensitivity } = await fetchPlanContext(supabase, scan.user_id);
    const limit = SCAN_LIMITS[tier] ?? 3;

    if (limit !== -1 && count > limit) {
      await updateScanStatus(supabase, scan.id, 'failed');
      throw new HttpError(403, 'Scan quota exceeded');
    }

    await updateScanStatus(supabase, scan.id, 'processing', true);

    const { data: urlData, error: urlError } = await supabase.storage
      .from('scan-images')
      .createSignedUrl(scan.image_path, 60);

    if (urlError || !urlData?.signedUrl) {
      console.error('[analyze-scan] signed URL error:', urlError);
      throw new HttpError(500, 'Could not generate signed URL for scan image');
    }

    const imageDataUrl = await downloadImageAsDataUrl(urlData.signedUrl);

    const features = await extractFeatures(imageDataUrl, {
      location: scan.location,
      notes: scan.notes,
    });

    const overrides: Partial<TriageInput> = {
      recurring_issue: scan.recurring_issue ?? 'unknown',
      musty_odor_present: scan.musty_odor_present ?? 'unknown',
      recent_water_event: scan.recent_water_event ?? 'unknown',
      occupant_symptoms_reported: scan.occupant_symptoms_reported ?? 'unknown',
      occupant_sensitivity: occupantSensitivity,
      humidity_percent: scan.humidity_percent ?? null,
      temperature_f: scan.temperature_f ?? null,
    };
    const triageInput = buildTriageInput(scan, features, overrides) as TriageInput;

    const triageOutput = runTriage(triageInput);
    console.log(
      `[analyze-scan] triage complete: action=${triageOutput.final.final_action_code}, risk_band=${triageOutput.iaq.risk_band}, gate=${triageOutput.final.review_gate_triggered}`,
    );

    const analysisRow = toAnalysisRow(triageOutput, features);

    const { error: insertError } = await supabase.from('analysis_results').upsert(
      { scan_id: scan.id, model_version: 'vNext.1+gpt-4o', ...analysisRow },
      { onConflict: 'scan_id' },
    );

    if (insertError) {
      console.error('[analyze-scan] failed to upsert analysis result:', insertError);
      throw new HttpError(500, 'Failed to save analysis result');
    }

    await updateScanStatus(supabase, scan.id, 'completed', true);
    markFailedOnError = false;

    await sendNotification(supabase, {
      userId: scan.user_id,
      type: 'scan_completed',
      title: 'Scan Complete',
      body: `Your scan of "${scan.location || 'your area'}" is ready. Tap to view results.`,
      data: { scanId: scan.id, screen: 'Results' },
    });

    return json({ success: true, scanId: scan.id });
  } catch (err) {
    if (markFailedOnError && scan && supabase) {
      await updateScanStatus(supabase, scan.id, 'failed');
    }

    console.error('[analyze-scan] error:', err);
    if (err instanceof HttpError) {
      return json({ error: err.message }, err.status);
    }

    return json({ error: 'Analysis failed' }, 500);
  }
});

