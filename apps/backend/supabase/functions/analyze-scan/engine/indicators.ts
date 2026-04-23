import type { TriageInput } from '../types.ts';

const INDICATOR_FIELDS: ReadonlyArray<keyof TriageInput> = [
  'visible_moisture_present',
  'visible_growth_present',
  'recurring_issue',
  'musty_odor_present',
  'occupant_symptoms_reported',
  'porous_material_wet',
];

// Step 1 — Count exact "yes" values across the six indicator fields.
export function countIndicators(input: TriageInput): number {
  return INDICATOR_FIELDS.filter((field) => input[field] === 'yes').length;
}
