import type { TriageInput, TriageOutput } from '../types.ts';
import { normalize } from './normalize.ts';
import { countIndicators } from './indicators.ts';
import { evaluateDecisionTree } from './decisionTree.ts';
import { computeIaqScores } from './iaqScoring.ts';
import { fuseActions } from './actionFusion.ts';
import { buildReasonCodes } from './reasonCodes.ts';
import { getMessages } from './messages.ts';
import { SAFETY_DISCLAIMERS } from './constants.ts';

// Orchestrates Steps 1-6 of the vNext.1 deterministic triage spec.
// Pure function: same input always produces same output. No side effects.
export function runTriage(raw: Partial<TriageInput>): TriageOutput {
  const input = normalize(raw);
  const indicatorCount = countIndicators(input);
  const decisionTree = evaluateDecisionTree(input, indicatorCount);
  const iaq = computeIaqScores(input);
  const { final_action_code, review_gate_triggered } = fuseActions({
    input,
    decisionTreeAction: decisionTree.action_code,
    iaqAction: iaq.risk_band_action_code,
  });
  const reason_codes = buildReasonCodes({
    input,
    indicatorCount,
    sporeLoadScore: iaq.spore_load_score,
    ratioScore: iaq.ratio_score,
    humidityScore: iaq.humidity_score,
    finalActionCode: final_action_code,
    decisionTreeAction: decisionTree.action_code,
    iaqAction: iaq.risk_band_action_code,
    reviewGateTriggered: review_gate_triggered,
  });
  const messages = getMessages(final_action_code);

  return {
    case_id: input.case_id,
    photo_id: input.photo_id,
    multiple_indicators_count: indicatorCount,
    decision_tree: decisionTree,
    iaq,
    final: { final_action_code, review_gate_triggered, reason_codes },
    messages,
    safety: SAFETY_DISCLAIMERS,
  };
}
