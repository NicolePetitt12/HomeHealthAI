import type { TriageInput, YesNoUnknown, YesNoUnknownPossible, SurfacePorosity, OccupantSensitivity, ImageQualityStatus, HumanReviewStatus } from '../types.ts';

const YES_NO_UNKNOWN: Set<string> = new Set(['yes', 'no', 'unknown']);
const YES_NO_UNKNOWN_POSSIBLE: Set<string> = new Set(['yes', 'no', 'unknown', 'possible']);
const SURFACE_POROSITY: Set<string> = new Set(['porous', 'semi_porous', 'non_porous', 'unknown']);
const OCCUPANT_SENSITIVITY: Set<string> = new Set(['standard', 'sensitive', 'highly_sensitive', 'unknown']);
const IMAGE_QUALITY: Set<string> = new Set(['good', 'limited', 'poor']);
const HUMAN_REVIEW: Set<string> = new Set(['not_required', 'recommended', 'required']);

function normCat<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  if (typeof value === 'string' && allowed.has(value)) return value as T;
  return fallback;
}

function normNum(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value)) return value;
  return null;
}

function normStr(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return 'unknown';
}

// Applies vNext.1 normalization rules to a raw input object, ensuring every
// field has a valid typed value before engine logic runs.
export function normalize(raw: Partial<TriageInput>): TriageInput {
  return {
    case_id: typeof raw.case_id === 'string' && raw.case_id.trim() ? raw.case_id.trim() : 'unknown',
    photo_id: typeof raw.photo_id === 'string' && raw.photo_id.trim() ? raw.photo_id.trim() : null,
    room_type: normStr(raw.room_type),
    surface_type: normStr(raw.surface_type),
    surface_porosity: normCat<SurfacePorosity>(raw.surface_porosity, SURFACE_POROSITY, 'unknown'),
    visible_color: normStr(raw.visible_color),
    visible_texture: normStr(raw.visible_texture),
    growth_pattern: normStr(raw.growth_pattern),
    estimated_area_sqft: normNum(raw.estimated_area_sqft),
    visible_moisture_present: normCat<YesNoUnknown>(raw.visible_moisture_present, YES_NO_UNKNOWN, 'unknown'),
    visible_growth_present: normCat<YesNoUnknown>(raw.visible_growth_present, YES_NO_UNKNOWN, 'unknown'),
    residue_likely: normCat<YesNoUnknown>(raw.residue_likely, YES_NO_UNKNOWN, 'unknown'),
    recent_water_event: normCat<YesNoUnknown>(raw.recent_water_event, YES_NO_UNKNOWN, 'unknown'),
    recurring_issue: normCat<YesNoUnknown>(raw.recurring_issue, YES_NO_UNKNOWN, 'unknown'),
    musty_odor_present: normCat<YesNoUnknown>(raw.musty_odor_present, YES_NO_UNKNOWN, 'unknown'),
    occupant_symptoms_reported: normCat<YesNoUnknown>(raw.occupant_symptoms_reported, YES_NO_UNKNOWN, 'unknown'),
    air_sample_available: normCat<YesNoUnknown>(raw.air_sample_available, YES_NO_UNKNOWN, 'no'),
    lab_sample_available: normCat<YesNoUnknown>(raw.lab_sample_available, YES_NO_UNKNOWN, 'no'),
    humidity_percent: normNum(raw.humidity_percent),
    temperature_f: normNum(raw.temperature_f),
    occupant_sensitivity: normCat<OccupantSensitivity>(raw.occupant_sensitivity, OCCUPANT_SENSITIVITY, 'unknown'),
    image_quality_status: normCat<ImageQualityStatus>(raw.image_quality_status, IMAGE_QUALITY, 'good'),
    human_review_status: normCat<HumanReviewStatus>(raw.human_review_status, HUMAN_REVIEW, 'not_required'),
    ai_initial_visual_group: normStr(raw.ai_initial_visual_group),
    indoor_total_spores_m3: normNum(raw.indoor_total_spores_m3),
    outdoor_total_spores_m3: normNum(raw.outdoor_total_spores_m3),
    dominant_group: normStr(raw.dominant_group),
    marker_mold_present: normCat<YesNoUnknownPossible>(raw.marker_mold_present, YES_NO_UNKNOWN_POSSIBLE, 'unknown'),
    mycotoxin_producer_present: normCat<YesNoUnknownPossible>(raw.mycotoxin_producer_present, YES_NO_UNKNOWN_POSSIBLE, 'unknown'),
    porous_material_wet: normCat<YesNoUnknown>(raw.porous_material_wet, YES_NO_UNKNOWN, 'unknown'),
  };
}
