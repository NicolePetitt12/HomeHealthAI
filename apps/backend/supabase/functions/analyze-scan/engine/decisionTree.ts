import type { TriageInput, DecisionTreeOutput, DecisionTreeResult } from '../types.ts';
import { DECISION_TREE_MAP } from './constants.ts';

// Step 2 — Apply the vNext.1 decision tree in order.
// Implements the exact branching logic from the "AI Decision Tree" sheet.
export function evaluateDecisionTree(
  input: TriageInput,
  indicatorCount: number,
): DecisionTreeResult {
  const output = classify(input, indicatorCount);
  const { action_code, confidence_label } = DECISION_TREE_MAP[output];
  return { output, action_code, confidence_label };
}

function classify(input: TriageInput, n: number): DecisionTreeOutput {
  // Step 0 — Hard review gate
  if (input.human_review_status === 'required' || input.image_quality_status === 'poor') {
    return 'needs_human_review';
  }

  // Step 1 — No visible growth branch
  if (input.visible_growth_present === 'no') {
    if (
      input.visible_moisture_present === 'yes' ||
      input.recent_water_event === 'yes' ||
      input.porous_material_wet === 'yes'
    ) {
      return 'moisture_concern';
    }
    if (input.surface_porosity === 'non_porous' && input.residue_likely === 'yes') {
      return 'surface_residue_monitor';
    }
    return 'low_visual_evidence';
  }

  // Step 2 — Porous/semi-porous surface with visible growth
  if (input.surface_porosity === 'porous' || input.surface_porosity === 'semi_porous') {
    if (n >= 4) return 'high_concern';
    if (
      input.recurring_issue === 'yes' ||
      (input.estimated_area_sqft !== null && input.estimated_area_sqft >= 2)
    ) {
      return 'elevated_concern';
    }
    return 'moderate_concern';
  }

  // Step 3 — Non-porous / unknown porosity with visible growth
  if (input.surface_porosity === 'non_porous' && input.residue_likely === 'yes') {
    return 'residue_supported_growth';
  }
  if (n >= 3) return 'moderate_concern';

  return 'needs_human_review';
}
