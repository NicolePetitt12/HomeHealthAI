import type { TriageInput, ActionCode } from '../types.ts';

interface ReasonCodesInput {
  input: TriageInput;
  indicatorCount: number;
  sporeLoadScore: number;
  ratioScore: number;
  humidityScore: number;
  finalActionCode: ActionCode;
  decisionTreeAction: ActionCode;
  iaqAction: ActionCode;
  reviewGateTriggered: boolean;
}

// Step 5 — Populate reason_codes from 21 predefined codes in exact spec order.
// Each code is included only when its trigger condition is true.
export function buildReasonCodes(ctx: ReasonCodesInput): string[] {
  const { input, indicatorCount, sporeLoadScore, ratioScore, humidityScore,
          finalActionCode, decisionTreeAction, iaqAction } = ctx;

  const codes: string[] = [];

  if (input.human_review_status === 'required') codes.push('review_required');
  if (input.image_quality_status === 'poor') codes.push('image_quality_poor');
  if (input.human_review_status === 'recommended' && input.image_quality_status === 'limited') {
    codes.push('image_quality_limited_review_recommended');
  }
  if (input.visible_growth_present === 'no') codes.push('visible_growth_absent');
  if (input.visible_moisture_present === 'yes') codes.push('visible_moisture_present');
  if (input.recent_water_event === 'yes') codes.push('recent_water_event');
  if (input.porous_material_wet === 'yes') codes.push('porous_material_wet');
  if (input.surface_porosity === 'non_porous' && input.residue_likely === 'yes') {
    codes.push('hard_surface_residue_likely');
  }
  if (
    input.visible_growth_present === 'yes' &&
    (input.surface_porosity === 'porous' || input.surface_porosity === 'semi_porous')
  ) {
    codes.push('porous_surface_growth');
  }
  if (indicatorCount >= 4) codes.push('multiple_indicators_ge_4');
  if (indicatorCount >= 3) codes.push('multiple_indicators_ge_3');
  if (input.recurring_issue === 'yes') codes.push('recurring_issue_present');
  if (input.estimated_area_sqft !== null && input.estimated_area_sqft >= 2) {
    codes.push('area_ge_2_sqft');
  }
  if (sporeLoadScore >= 10) codes.push('indoor_spore_load_elevated');
  if (ratioScore >= 10) codes.push('indoor_outdoor_ratio_elevated');
  if (input.marker_mold_present === 'yes') codes.push('marker_flag_present');
  if (input.mycotoxin_producer_present === 'yes') codes.push('mycotoxin_flag_present');
  if (humidityScore > 0) codes.push('humidity_elevated');
  if (input.occupant_sensitivity === 'sensitive' || input.occupant_sensitivity === 'highly_sensitive') {
    codes.push('sensitive_occupant');
  }
  if (finalActionCode === iaqAction && finalActionCode !== decisionTreeAction) {
    codes.push('final_action_from_iaq');
  }
  if (finalActionCode === decisionTreeAction && finalActionCode !== iaqAction) {
    codes.push('final_action_from_decision_tree');
  }

  return codes;
}
