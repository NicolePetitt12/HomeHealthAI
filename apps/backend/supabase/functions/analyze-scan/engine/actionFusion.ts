import type { TriageInput, ActionCode } from '../types.ts';
import { ACTION_SEVERITY } from './constants.ts';

interface FusionInput {
  input: TriageInput;
  decisionTreeAction: ActionCode;
  iaqAction: ActionCode;
}

interface FusionResult {
  final_action_code: ActionCode;
  review_gate_triggered: boolean;
}

// Step 4 — Fuse decision tree action vs IAQ action, applying review gates first.
export function fuseActions({ input, decisionTreeAction, iaqAction }: FusionInput): FusionResult {
  // Hard gate: required review or poor image quality
  if (input.human_review_status === 'required' || input.image_quality_status === 'poor') {
    return { final_action_code: 'collect_more_data', review_gate_triggered: true };
  }

  // Soft gate: recommended review + limited image quality
  if (input.human_review_status === 'recommended' && input.image_quality_status === 'limited') {
    return { final_action_code: 'collect_more_data', review_gate_triggered: true };
  }

  // Pick the higher-severity action
  const dtSeverity = ACTION_SEVERITY[decisionTreeAction];
  const iaqSeverity = ACTION_SEVERITY[iaqAction];
  const final_action_code = iaqSeverity >= dtSeverity ? iaqAction : decisionTreeAction;

  return { final_action_code, review_gate_triggered: false };
}
