import type { VisualFeatures, TriageInput } from '../types.ts';

interface ScanRecord {
  id: string;
  image_path: string;
  location?: string | null;
  notes?: string | null;
}

// Merges the scan record and LLM visual features into a complete TriageInput,
// defaulting all non-visual contextual fields to "unknown" / null per vNext.1
// normalization rules. When the UI captures additional fields (recurring_issue,
// musty_odor_present, etc.) they can be passed as overrides.
export function buildTriageInput(
  scan: ScanRecord,
  features: VisualFeatures,
  overrides: Partial<TriageInput> = {},
): Partial<TriageInput> {
  return {
    case_id: scan.id,
    photo_id: scan.image_path ?? null,

    // ── Visual fields from LLM ──────────────────────────────────────────────
    room_type: features.room_type,
    surface_type: features.surface_type,
    surface_porosity: features.surface_porosity,
    visible_color: features.visible_color,
    visible_texture: features.visible_texture,
    growth_pattern: features.growth_pattern,
    estimated_area_sqft: features.estimated_area_sqft,
    visible_moisture_present: features.visible_moisture_present,
    visible_growth_present: features.visible_growth_present,
    residue_likely: features.residue_likely,
    porous_material_wet: features.porous_material_wet,
    image_quality_status: features.image_quality_status,
    ai_initial_visual_group: features.ai_initial_visual_group,

    // ── Contextual fields — default to unknown / null in MVP ───────────────
    recent_water_event: 'unknown',
    recurring_issue: 'unknown',
    musty_odor_present: 'unknown',
    occupant_symptoms_reported: 'unknown',
    air_sample_available: 'no',
    lab_sample_available: 'no',
    humidity_percent: null,
    temperature_f: null,
    occupant_sensitivity: 'unknown',
    human_review_status: 'not_required',
    indoor_total_spores_m3: null,
    outdoor_total_spores_m3: null,
    dominant_group: 'unknown',
    marker_mold_present: 'unknown',
    mycotoxin_producer_present: 'unknown',

    // ── Apply any overrides from future UI expansions ──────────────────────
    ...overrides,
  };
}
