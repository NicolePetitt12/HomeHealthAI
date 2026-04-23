import type { ActionCode, DecisionTreeOutput, RiskBand } from '../types.ts';

// ─── Decision tree output → action + confidence lookup ───────────────────────

export const DECISION_TREE_MAP: Record<
  DecisionTreeOutput,
  { action_code: ActionCode; confidence_label: string }
> = {
  low_visual_evidence:      { action_code: 'educate_monitor',        confidence_label: 'low' },
  surface_residue_monitor:  { action_code: 'clean_monitor',          confidence_label: 'low_to_moderate' },
  moisture_concern:         { action_code: 'inspect_source',         confidence_label: 'moderate' },
  residue_supported_growth: { action_code: 'clean_monitor',          confidence_label: 'moderate' },
  moderate_concern:         { action_code: 'targeted_inspection',    confidence_label: 'moderate_to_high' },
  elevated_concern:         { action_code: 'prompt_inspection',      confidence_label: 'high' },
  high_concern:             { action_code: 'professional_inspection', confidence_label: 'high' },
  needs_human_review:       { action_code: 'collect_more_data',      confidence_label: 'variable' },
};

// ─── Risk band → action code lookup ──────────────────────────────────────────

export const RISK_BAND_ACTION: Record<RiskBand, ActionCode> = {
  low:          'educate_monitor',
  guarded:      'clean_monitor',
  moderate:     'targeted_inspection',
  elevated:     'professional_inspection',
  high_concern: 'contain_and_inspect',
};

// ─── Action code severity scale ───────────────────────────────────────────────

export const ACTION_SEVERITY: Record<ActionCode, number> = {
  educate_monitor:         10,
  clean_monitor:           20,
  inspect_source:          30,
  collect_more_data:       35,
  targeted_inspection:     40,
  prompt_inspection:       50,
  professional_inspection: 60,
  contain_and_inspect:     70,
};

// ─── Max raw score denominator (from spec) ───────────────────────────────────

export const IAQ_MAX_RAW = 95;

// ─── Safety disclaimers (fixed per spec Step 7) ──────────────────────────────

export const SAFETY_DISCLAIMERS = {
  medical_disclaimer: 'This is not a medical diagnosis.',
  visual_disclaimer: 'Photos cannot confirm species, viability, or medical impact.',
  lab_disclaimer: 'Air or lab context should be interpreted against field conditions and appropriate comparison samples.',
} as const;
