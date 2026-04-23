import { z } from 'zod';

// ─── Canonical vNext.1 enums ──────────────────────────────────────────────────

export const YesNoUnknown = z.enum(['yes', 'no', 'unknown']);
export type YesNoUnknown = z.infer<typeof YesNoUnknown>;

export const YesNoUnknownPossible = z.enum(['yes', 'no', 'unknown', 'possible']);
export type YesNoUnknownPossible = z.infer<typeof YesNoUnknownPossible>;

export const SurfacePorosity = z.enum(['porous', 'semi_porous', 'non_porous', 'unknown']);
export type SurfacePorosity = z.infer<typeof SurfacePorosity>;

export const OccupantSensitivity = z.enum(['standard', 'sensitive', 'highly_sensitive', 'unknown']);
export type OccupantSensitivity = z.infer<typeof OccupantSensitivity>;

export const ImageQualityStatus = z.enum(['good', 'limited', 'poor']);
export type ImageQualityStatus = z.infer<typeof ImageQualityStatus>;

export const HumanReviewStatus = z.enum(['not_required', 'recommended', 'required']);
export type HumanReviewStatus = z.infer<typeof HumanReviewStatus>;

export const DecisionTreeOutput = z.enum([
  'low_visual_evidence',
  'surface_residue_monitor',
  'moisture_concern',
  'residue_supported_growth',
  'moderate_concern',
  'elevated_concern',
  'high_concern',
  'needs_human_review',
]);
export type DecisionTreeOutput = z.infer<typeof DecisionTreeOutput>;

export const RiskBand = z.enum(['low', 'guarded', 'moderate', 'elevated', 'high_concern']);
export type RiskBand = z.infer<typeof RiskBand>;

export const ActionCode = z.enum([
  'educate_monitor',
  'clean_monitor',
  'inspect_source',
  'collect_more_data',
  'targeted_inspection',
  'prompt_inspection',
  'professional_inspection',
  'contain_and_inspect',
]);
export type ActionCode = z.infer<typeof ActionCode>;

// ─── Visual features (extracted by LLM from image) ───────────────────────────

export const VisualFeaturesSchema = z.object({
  room_type: z.string().default('unknown'),
  surface_type: z.string().default('unknown'),
  surface_porosity: SurfacePorosity.default('unknown'),
  visible_color: z.string().default('unknown'),
  visible_texture: z.string().default('unknown'),
  growth_pattern: z.string().default('unknown'),
  estimated_area_sqft: z.number().nullable().default(null),
  visible_moisture_present: YesNoUnknown.default('unknown'),
  visible_growth_present: YesNoUnknown.default('unknown'),
  residue_likely: YesNoUnknown.default('unknown'),
  image_quality_status: ImageQualityStatus.default('good'),
  ai_initial_visual_group: z.string().default('unknown'),
  porous_material_wet: YesNoUnknown.default('unknown'),
  // Kept for UI backwards-compat
  suspected_mold_type: z.string().nullable().default(null),
  suspected_mold_description: z.string().nullable().default(null),
  mold_candidates: z.array(z.object({
    type: z.string(),
    description: z.string(),
    confidence: z.number().int().min(0).max(100),
  })).default([]),
});
export type VisualFeatures = z.infer<typeof VisualFeaturesSchema>;

// ─── Triage input (30 vNext.1 fields) ────────────────────────────────────────
// Visual fields come from VisualFeatures; contextual fields default to unknown/null.

export const TriageInputSchema = z.object({
  case_id: z.string().default('unknown'),
  photo_id: z.string().nullable().default(null),
  room_type: z.string().default('unknown'),
  surface_type: z.string().default('unknown'),
  surface_porosity: SurfacePorosity.default('unknown'),
  visible_color: z.string().default('unknown'),
  visible_texture: z.string().default('unknown'),
  growth_pattern: z.string().default('unknown'),
  estimated_area_sqft: z.number().nullable().default(null),
  visible_moisture_present: YesNoUnknown.default('unknown'),
  visible_growth_present: YesNoUnknown.default('unknown'),
  residue_likely: YesNoUnknown.default('unknown'),
  recent_water_event: YesNoUnknown.default('unknown'),
  recurring_issue: YesNoUnknown.default('unknown'),
  musty_odor_present: YesNoUnknown.default('unknown'),
  occupant_symptoms_reported: YesNoUnknown.default('unknown'),
  air_sample_available: YesNoUnknown.default('no'),
  lab_sample_available: YesNoUnknown.default('no'),
  humidity_percent: z.number().nullable().default(null),
  temperature_f: z.number().nullable().default(null),
  occupant_sensitivity: OccupantSensitivity.default('unknown'),
  image_quality_status: ImageQualityStatus.default('good'),
  human_review_status: HumanReviewStatus.default('not_required'),
  ai_initial_visual_group: z.string().default('unknown'),
  indoor_total_spores_m3: z.number().nullable().default(null),
  outdoor_total_spores_m3: z.number().nullable().default(null),
  dominant_group: z.string().default('unknown'),
  marker_mold_present: YesNoUnknownPossible.default('unknown'),
  mycotoxin_producer_present: YesNoUnknownPossible.default('unknown'),
  porous_material_wet: YesNoUnknown.default('unknown'),
});
export type TriageInput = z.infer<typeof TriageInputSchema>;

// ─── Triage output (vNext.1 Step 7 shape) ────────────────────────────────────

export const DecisionTreeResultSchema = z.object({
  output: DecisionTreeOutput,
  action_code: ActionCode,
  confidence_label: z.string(),
});

export const IaqScoresSchema = z.object({
  spore_load_score: z.number().int(),
  indoor_outdoor_ratio: z.number().nullable(),
  ratio_score: z.number().int(),
  marker_score: z.number().int(),
  mycotoxin_score: z.number().int(),
  visible_growth_score: z.number().int(),
  porous_wet_score: z.number().int(),
  humidity_score: z.number().int(),
  sensitivity_score: z.number().int(),
  raw_total_score: z.number().int(),
  normalized_risk_score: z.number(),
  risk_band: RiskBand,
  risk_band_action_code: ActionCode,
});

export const FinalSchema = z.object({
  final_action_code: ActionCode,
  review_gate_triggered: z.boolean(),
  reason_codes: z.array(z.string()),
});

export const TriageOutputSchema = z.object({
  case_id: z.string(),
  photo_id: z.string().nullable(),
  multiple_indicators_count: z.number().int(),
  decision_tree: DecisionTreeResultSchema,
  iaq: IaqScoresSchema,
  final: FinalSchema,
  messages: z.object({
    homeowner: z.string(),
    professional: z.string(),
  }),
  safety: z.object({
    medical_disclaimer: z.string(),
    visual_disclaimer: z.string(),
    lab_disclaimer: z.string(),
  }),
});
export type TriageOutput = z.infer<typeof TriageOutputSchema>;
