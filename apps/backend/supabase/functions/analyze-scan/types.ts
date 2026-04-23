// Shared type aliases for the analyze-scan function (Deno — no npm imports).
// These mirror packages/shared/src/schemas/triage.schema.ts but are inlined
// here so the edge function doesn't depend on the npm workspace at runtime.

export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type YesNoUnknownPossible = 'yes' | 'no' | 'unknown' | 'possible';
export type SurfacePorosity = 'porous' | 'semi_porous' | 'non_porous' | 'unknown';
export type OccupantSensitivity = 'standard' | 'sensitive' | 'highly_sensitive' | 'unknown';
export type ImageQualityStatus = 'good' | 'limited' | 'poor';
export type HumanReviewStatus = 'not_required' | 'recommended' | 'required';
export type DecisionTreeOutput =
  | 'low_visual_evidence'
  | 'surface_residue_monitor'
  | 'moisture_concern'
  | 'residue_supported_growth'
  | 'moderate_concern'
  | 'elevated_concern'
  | 'high_concern'
  | 'needs_human_review';
export type RiskBand = 'low' | 'guarded' | 'moderate' | 'elevated' | 'high_concern';
export type ActionCode =
  | 'educate_monitor'
  | 'clean_monitor'
  | 'inspect_source'
  | 'collect_more_data'
  | 'targeted_inspection'
  | 'prompt_inspection'
  | 'professional_inspection'
  | 'contain_and_inspect';

export interface VisualFeatures {
  room_type: string;
  surface_type: string;
  surface_porosity: SurfacePorosity;
  visible_color: string;
  visible_texture: string;
  growth_pattern: string;
  estimated_area_sqft: number | null;
  visible_moisture_present: YesNoUnknown;
  visible_growth_present: YesNoUnknown;
  residue_likely: YesNoUnknown;
  image_quality_status: ImageQualityStatus;
  ai_initial_visual_group: string;
  porous_material_wet: YesNoUnknown;
  suspected_mold_type: string | null;
  suspected_mold_description: string | null;
  mold_candidates: Array<{ type: string; description: string; confidence: number }>;
}

export interface TriageInput {
  case_id: string;
  photo_id: string | null;
  room_type: string;
  surface_type: string;
  surface_porosity: SurfacePorosity;
  visible_color: string;
  visible_texture: string;
  growth_pattern: string;
  estimated_area_sqft: number | null;
  visible_moisture_present: YesNoUnknown;
  visible_growth_present: YesNoUnknown;
  residue_likely: YesNoUnknown;
  recent_water_event: YesNoUnknown;
  recurring_issue: YesNoUnknown;
  musty_odor_present: YesNoUnknown;
  occupant_symptoms_reported: YesNoUnknown;
  air_sample_available: YesNoUnknown;
  lab_sample_available: YesNoUnknown;
  humidity_percent: number | null;
  temperature_f: number | null;
  occupant_sensitivity: OccupantSensitivity;
  image_quality_status: ImageQualityStatus;
  human_review_status: HumanReviewStatus;
  ai_initial_visual_group: string;
  indoor_total_spores_m3: number | null;
  outdoor_total_spores_m3: number | null;
  dominant_group: string;
  marker_mold_present: YesNoUnknownPossible;
  mycotoxin_producer_present: YesNoUnknownPossible;
  porous_material_wet: YesNoUnknown;
}

export interface DecisionTreeResult {
  output: DecisionTreeOutput;
  action_code: ActionCode;
  confidence_label: string;
}

export interface IaqScores {
  spore_load_score: number;
  indoor_outdoor_ratio: number | null;
  ratio_score: number;
  marker_score: number;
  mycotoxin_score: number;
  visible_growth_score: number;
  porous_wet_score: number;
  humidity_score: number;
  sensitivity_score: number;
  raw_total_score: number;
  normalized_risk_score: number;
  risk_band: RiskBand;
  risk_band_action_code: ActionCode;
}

export interface TriageOutput {
  case_id: string;
  photo_id: string | null;
  multiple_indicators_count: number;
  decision_tree: DecisionTreeResult;
  iaq: IaqScores;
  final: {
    final_action_code: ActionCode;
    review_gate_triggered: boolean;
    reason_codes: string[];
  };
  messages: {
    homeowner: string;
    professional: string;
  };
  safety: {
    medical_disclaimer: string;
    visual_disclaimer: string;
    lab_disclaimer: string;
  };
}
