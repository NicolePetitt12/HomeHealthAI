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
  // UI display fields
  likely_issue: string;
  description: string;
  recommendation_title: string;
  recommendations: string[];
  suggested_professional_type: ProfessionalType | null;
  suspected_mold_type: string | null;
  suspected_mold_description: string | null;
}

// ─── Mock analysis generator ──────────────────────────────────────────────────
// TODO: Replace this function with a real LLM call (Claude or GPT-4o).
// The LLM should receive:
//   - A signed URL for the scan image (from Supabase Storage)
//   - The Inspector Gnome system prompt (friendly homeowner-facing tone)
//   - The scan location and notes as context
// It should return a structured JSON response matching AnalysisPayload above.

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomConfidence(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

const MOLD_TYPES: Array<{ type: string; description: string }> = [
  {
    type: 'Stachybotrys chartarum',
    description: 'Commonly known as black mold. Thrives in areas with chronic moisture and cellulose-rich materials. Produces mycotoxins that can cause serious health effects with prolonged exposure.',
  },
  {
    type: 'Aspergillus niger',
    description: 'A dark mold frequently found in damp indoor environments. Can trigger respiratory issues and allergic reactions, especially in individuals with weakened immune systems.',
  },
  {
    type: 'Cladosporium sphaerospermum',
    description: 'One of the most common household molds. Typically olive-green to black, found on walls, fabrics, and wood. Generally less toxic but can cause allergic symptoms.',
  },
  {
    type: 'Chaetomium globosum',
    description: 'A water-damage indicator mold with a musty smell. Found in drywall, carpet, and wood after flooding or leaks. Associated with respiratory problems and neurological effects.',
  },
  {
    type: 'Penicillium chrysogenum',
    description: 'Blue-green mold that spreads quickly through spores. Commonly found in water-damaged insulation and walls. Can cause allergic reactions and respiratory issues.',
  },
];

const HIGH_FINDINGS_POOL: Finding[][] = [
  [
    { type: 'Active Mold Colony', description: 'Dense dark colony growth consistent with active mold. Surface texture and discoloration indicate established growth.', location: 'Center of frame', severity: 'high' },
    { type: 'Moisture Damage', description: 'Surface deterioration and staining from prolonged water exposure. Structural material shows signs of degradation.', location: 'Along lower edge', severity: 'high' },
  ],
  [
    { type: 'Visible Mold Growth', description: 'Black-green discoloration with fuzzy texture strongly indicative of active mold colonization.', location: 'Upper left area', severity: 'high' },
    { type: 'Water Intrusion', description: 'Staining patterns suggest recurring moisture — likely from a leak or condensation buildup.', location: 'Behind and around growth', severity: 'moderate' },
  ],
  [
    { type: 'Extensive Surface Mold', description: 'Widespread mold coverage across multiple surfaces. Growth appears well-established and may have penetrated below the surface.', location: 'Full frame', severity: 'high' },
    { type: 'Material Compromise', description: 'Host material shows deterioration consistent with biological growth over weeks to months.', severity: 'high' },
  ],
];

const HIGH_NEXT_STEPS = [
  'Do not disturb the area — scrubbing can spread spores throughout the room',
  'Seal off the area with plastic sheeting until professionally remediated',
  'Identify and fix the moisture source (leak, condensation, or flooding)',
  'Contact a certified mold remediation specialist for a professional assessment',
  'Avoid prolonged exposure — wear an N95 mask if you must enter the area',
  'Document the affected area with photos for insurance or contractor purposes',
];

const MODERATE_FINDINGS_POOL: Finding[][] = [
  [
    { type: 'Moisture Staining', description: 'Discoloration consistent with water intrusion. May indicate a recurring source nearby.', location: 'Upper section', severity: 'moderate' },
    { type: 'Surface Efflorescence', description: 'White mineral deposits indicating water has moved through the material repeatedly.', severity: 'low' },
  ],
  [
    { type: 'Suspected Mold Spores', description: 'Small dark specks that may be early-stage mold or environmental debris. Inconclusive without lab testing.', location: 'Corner area', severity: 'moderate' },
    { type: 'Elevated Moisture Indicator', description: 'Surface appearance suggests above-normal moisture levels. Conditions are favorable for mold growth.', severity: 'moderate' },
  ],
  [
    { type: 'Water Damage Residue', description: 'Previous water exposure has left staining and surface irregularities. Current dryness does not rule out mold beneath.', severity: 'moderate' },
    { type: 'Possible Biofilm', description: 'Faint discoloration that could be early microbial growth. Hard to confirm from image alone — a physical inspection is recommended.', location: 'Along edge', severity: 'low' },
  ],
];

const MODERATE_NEXT_STEPS = [
  'Find and fix any moisture source before treating the surface',
  'Improve ventilation — use a fan or open windows daily',
  'Clean the stained area with a diluted bleach solution (1 cup per gallon)',
  'Monitor the area weekly for the next month for any new growth',
  'Consider a professional inspection to rule out hidden mold behind walls',
  'Use a moisture meter to check if humidity levels are elevated in the area',
];

const LOW_FINDINGS_POOL: Finding[][] = [
  [
    { type: 'Minor Dust / Debris', description: 'Surface dust present but no indicators of biological growth. Appears to be normal accumulation.', severity: 'low' },
  ],
  [
    { type: 'Normal Surface Wear', description: 'Minor scuffs and surface discoloration from regular use. No signs of moisture damage or organic growth.', severity: 'low' },
  ],
  [
    { type: 'Dried Residue', description: 'Light surface residue — likely soap scum, mineral deposits, or dried cleaning product. Not consistent with mold.', severity: 'low' },
  ],
];

const LOW_NEXT_STEPS = [
  'Keep the area well-ventilated, especially after showers or cooking',
  'Maintain indoor humidity below 60% — use a dehumidifier in damp seasons',
  'Re-scan in 3–6 months or any time you notice new discoloration or odors',
  'Wipe surfaces dry after water contact to prevent future moisture buildup',
];

function generateMockAnalysis(_location: string): AnalysisPayload {
  const levels: RiskLevel[] = ['low', 'moderate', 'high'];
  const riskLevel = pick(levels);

  if (riskLevel === 'high') {
    const moldEntry = pick(MOLD_TYPES);
    return {
      risk_level: 'high',
      confidence: randomConfidence(0.80, 0.97),
      findings: pick(HIGH_FINDINGS_POOL),
      explanation:
        "I can see what looks like active mold growth in this area. The dark discoloration and texture are consistent with mold colonies caused by sustained moisture. This needs attention soon — the longer it goes untreated, the more it spreads.",
      next_steps: HIGH_NEXT_STEPS,
      model_version: 'mock-v1',
      likely_issue: 'Mold Suspected',
      description: 'Active mold growth was detected in this area. Immediate professional remediation is strongly recommended to prevent further spread and protect your health.',
      recommendation_title: 'Immediate Action Required',
      recommendations: pick([
        [
          'Seal off the affected area to prevent spore spread',
          'Do not attempt DIY cleaning for large infestations',
          'Contact a certified mold remediation specialist',
          'Address the moisture source to prevent recurrence',
        ],
        [
          'Avoid spending time in the affected area without an N95 mask',
          'Seal vents and doorways to contain spores',
          'Get a professional air quality test after remediation',
          'Fix any plumbing or roof leaks contributing to moisture',
        ],
        [
          'Document the damage with photos for insurance purposes',
          'Turn off HVAC to prevent spore circulation through the building',
          'Schedule professional remediation within the next 48 hours',
          'Consider temporary relocation if the affected area is large',
        ],
      ]),
      suggested_professional_type: 'remediation',
      suspected_mold_type: moldEntry.type,
      suspected_mold_description: moldEntry.description,
    };
  }

  if (riskLevel === 'moderate') {
    return {
      risk_level: 'moderate',
      confidence: randomConfidence(0.60, 0.79),
      findings: pick(MODERATE_FINDINGS_POOL),
      explanation:
        "I found moisture staining that suggests this area has been wet at some point. There are early signs that mold could develop if the moisture source is not addressed. Catching it at this stage gives you options before it becomes a bigger problem.",
      next_steps: MODERATE_NEXT_STEPS,
      model_version: 'mock-v1',
      likely_issue: 'Inconclusive',
      description: 'Moisture damage and possible early-stage mold activity were detected. A professional inspection is recommended to confirm and assess the extent of the issue.',
      recommendation_title: 'Inspection Recommended',
      recommendations: pick([
        [
          'Schedule a professional mold inspection within the next week',
          'Fix any visible water leaks or condensation issues',
          'Run a dehumidifier to bring humidity below 55%',
          'Monitor the area daily and re-scan if it worsens',
        ],
        [
          'Clean visible staining with a diluted bleach or vinegar solution',
          'Improve air circulation with fans or open windows',
          'Check behind walls or under flooring for hidden moisture',
          'Re-scan in 2–3 weeks to track changes',
        ],
        [
          'Use a moisture meter to identify the extent of water infiltration',
          'Seal any cracks or gaps that could allow moisture in',
          'Install a vent or exhaust fan if this is a high-humidity area',
          'Consider a professional assessment if staining continues to grow',
        ],
      ]),
      suggested_professional_type: 'inspector',
      suspected_mold_type: null,
      suspected_mold_description: null,
    };
  }

  // low
  return {
    risk_level: 'low',
    confidence: randomConfidence(0.82, 0.96),
    findings: pick(LOW_FINDINGS_POOL),
    explanation:
      "Good news — I did not find any clear signs of active mold or serious moisture damage in this photo. The area looks generally dry and clean. Keep up with regular ventilation and you should be in good shape.",
    next_steps: LOW_NEXT_STEPS,
    model_version: 'mock-v1',
    likely_issue: 'No Mold Detected',
    description: 'No signs of active mold or significant moisture damage were found. The area appears healthy. Keep up with regular maintenance to stay ahead of any future issues.',
    recommendation_title: 'Keep Up the Good Work',
    recommendations: pick([
      [
        'Continue regular cleaning and ventilation in this area',
        'Use exhaust fans when cooking or showering nearby',
        'Re-scan seasonally or after any water events',
      ],
      [
        'Maintain humidity below 60% year-round',
        'Inspect the area again after heavy rain or flooding',
        'Wipe down surfaces regularly to prevent dust and moisture buildup',
      ],
      [
        'Keep gutters and drainage clear to prevent water from reaching this area',
        'Check window and door seals annually for gaps',
        'Re-scan any time you notice musty odors or new discoloration',
      ],
    ]),
    suggested_professional_type: null,
    suspected_mold_type: null,
    suspected_mold_description: null,
  };
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

  // 1. Enforce scan quota (server-side defense)
  const SCAN_LIMITS: Record<string, number> = { free: 3, home: 20, pro: -1 };

  const [{ data: planTier }, { data: scanCount }] = await Promise.all([
    supabase.rpc('get_user_plan_tier', { p_user_id: scan.user_id }),
    supabase.rpc('get_monthly_scan_count', { p_user_id: scan.user_id }),
  ]);

  const tier: string = planTier ?? 'free';
  const count: number = scanCount ?? 0;
  const limit = SCAN_LIMITS[tier] ?? 3;

  // Note: the scan itself is already counted, so the current scan is included
  // in the monthly count. We allow it if count <= limit (unlimited = -1).
  if (limit !== -1 && count > limit) {
    await supabase.from('scans').update({ status: 'failed' }).eq('id', scan.id);
    return new Response(JSON.stringify({ error: 'Scan quota exceeded' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Mark scan as processing
  await supabase
    .from('scans')
    .update({ status: 'processing' })
    .eq('id', scan.id);

  try {
    // 3. TODO: Get signed URL for the image to pass to LLM
    // const { data: urlData } = await supabase.storage
    //   .from('scan-images')
    //   .createSignedUrl(scan.image_path, 60);
    // const imageUrl = urlData?.signedUrl;

    // 4. Generate analysis (mock — replace with real LLM call)
    const analysis = generateMockAnalysis(scan.location);

    // 5. Upsert analysis result (idempotent — safe if called multiple times for same scan)
    const { error: insertError } = await supabase.from('analysis_results').upsert(
      {
        scan_id: scan.id,
        risk_level: analysis.risk_level,
        confidence: analysis.confidence,
        findings: analysis.findings,
        explanation: analysis.explanation,
        next_steps: analysis.next_steps,
        model_version: analysis.model_version,
        likely_issue: analysis.likely_issue,
        description: analysis.description,
        recommendation_title: analysis.recommendation_title,
        recommendations: analysis.recommendations,
        suggested_professional_type: analysis.suggested_professional_type,
        suspected_mold_type: analysis.suspected_mold_type,
        suspected_mold_description: analysis.suspected_mold_description,
      },
      { onConflict: 'scan_id' },
    );

    if (insertError) throw insertError;

    // 6. Mark scan as completed
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
