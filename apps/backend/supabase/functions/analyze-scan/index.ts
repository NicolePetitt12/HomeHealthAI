import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'low' | 'moderate' | 'high';
type ProfessionalType = 'inspector' | 'remediation' | 'plumber' | 'hvac';

interface ScanRecord {
  id: string;
  user_id: string;
  image_path: string;
  location: string;
  notes: string | null;
  status: string;
}

interface Finding {
  type: string;
  description: string;
  location?: string;
  severity?: RiskLevel;
}

interface AnalysisPayload {
  risk_level: RiskLevel;
  confidence: number;
  findings: Finding[];
  explanation: string;
  next_steps: string[];
  model_version: string;
}

// ─── Mock analysis generator ──────────────────────────────────────────────────
// TODO: Replace this function with a real LLM call (Claude or GPT-4o).
// The LLM should receive:
//   - A signed URL for the scan image (from Supabase Storage)
//   - The Inspector Gnome system prompt (friendly homeowner-facing tone)
//   - The scan location and notes as context
// It should return a structured JSON response matching AnalysisPayload above.

function generateMockAnalysis(location: string): AnalysisPayload {
  // Rotate through risk levels based on location string length for variety
  const levels: RiskLevel[] = ['low', 'moderate', 'high'];
  const riskLevel = levels[location.length % 3];

  const payloads: Record<RiskLevel, AnalysisPayload> = {
    high: {
      risk_level: 'high',
      confidence: 0.92,
      findings: [
        {
          type: 'Active Mold',
          description: 'Dark colony growth visible on surface, consistent with common household mold species.',
          location: 'Center of frame',
          severity: 'high',
        },
        {
          type: 'Moisture Damage',
          description: 'Staining and surface deterioration indicate prolonged water exposure.',
          location: 'Along lower edge',
          severity: 'high',
        },
      ],
      explanation:
        "I can see what looks like active mold growth in this area. The dark discoloration and texture are consistent with mold colonies caused by sustained moisture. This needs attention soon — the longer it goes untreated, the more it spreads.",
      next_steps: [
        'Do not disturb the area — avoid scrubbing, which can spread spores',
        'Seal off the area with plastic sheeting until professionally remediated',
        'Identify and fix the moisture source (leak, condensation, or flooding)',
        'Contact a certified mold remediation specialist for assessment',
      ],
      model_version: 'mock-v1',
    },
    moderate: {
      risk_level: 'moderate',
      confidence: 0.74,
      findings: [
        {
          type: 'Moisture Staining',
          description: 'Discoloration consistent with water intrusion. Likely from a recurring source.',
          location: 'Upper section',
          severity: 'moderate',
        },
        {
          type: 'Surface Efflorescence',
          description: 'White mineral deposits indicating water has passed through repeatedly.',
          severity: 'low',
        },
      ],
      explanation:
        "I found moisture staining that suggests this area has been wet at some point. There are early signs that mold could develop if the moisture source is not addressed. The good news: catching it at this stage gives you options before it becomes a bigger problem.",
      next_steps: [
        'Find and fix the moisture source before treating the surface',
        'Improve ventilation — use a fan or open windows regularly',
        'Clean the stained area with a diluted bleach solution',
        'Monitor the area over the next 2–4 weeks for any new growth',
      ],
      model_version: 'mock-v1',
    },
    low: {
      risk_level: 'low',
      confidence: 0.88,
      findings: [
        {
          type: 'Minor Dust / Debris',
          description: 'Some surface dust present, but no indicators of biological growth.',
          severity: 'low',
        },
      ],
      explanation:
        "Good news — I did not find any clear signs of active mold or serious moisture damage in this photo. The area looks generally dry and clean. Keep up with regular ventilation and you should be in good shape.",
      next_steps: [
        'Keep the area well-ventilated, especially after showers or cooking',
        'Maintain indoor humidity below 60% — use a dehumidifier if needed',
        'Re-scan in 3–6 months or any time you notice new discoloration or odors',
      ],
      model_version: 'mock-v1',
    },
  };

  return payloads[riskLevel];
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow only POST
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

  // 1. Mark scan as processing
  await supabase
    .from('scans')
    .update({ status: 'processing' })
    .eq('id', scan.id);

  try {
    // 2. TODO: Get signed URL for the image to pass to LLM
    // const { data: urlData } = await supabase.storage
    //   .from('scan-images')
    //   .createSignedUrl(scan.image_path, 60);
    // const imageUrl = urlData?.signedUrl;

    // 3. Generate analysis (mock — replace with real LLM call)
    const analysis = generateMockAnalysis(scan.location);

    // 4. Insert analysis result
    const { error: insertError } = await supabase.from('analysis_results').insert({
      scan_id: scan.id,
      risk_level: analysis.risk_level,
      confidence: analysis.confidence,
      findings: analysis.findings,
      explanation: analysis.explanation,
      next_steps: analysis.next_steps,
      model_version: analysis.model_version,
    });

    if (insertError) throw insertError;

    // 5. Mark scan as completed
    await supabase
      .from('scans')
      .update({ status: 'completed' })
      .eq('id', scan.id);

    return new Response(JSON.stringify({ success: true, scanId: scan.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Mark scan as failed
    await supabase
      .from('scans')
      .update({ status: 'failed' })
      .eq('id', scan.id);

    console.error('analyze-scan error:', err);

    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
