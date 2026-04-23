import type { ActionCode } from '../types.ts';

interface MessagePair {
  homeowner: string;
  professional: string;
}

// Step 6 — Deterministic message lookup by final_action_code.
// Texts are copied verbatim from the vNext.1 spec Step 6.
const MESSAGE_MAP: Record<ActionCode, MessagePair> = {
  educate_monitor: {
    homeowner: 'Current inputs do not show strong evidence of active indoor amplification. Keep the area dry, watch for changes, and re-check if conditions worsen.',
    professional: 'Current visual and IAQ inputs do not show strong evidence of active amplification. Continue moisture prevention and monitor for change.',
  },
  clean_monitor: {
    homeowner: 'This pattern may reflect residue or light surface contamination on a hard surface. Clean compatible hard surfaces, control moisture, and monitor for recurrence.',
    professional: 'Findings are more consistent with residue-supported hard-surface growth or light contamination. Verify there is no hidden moisture and monitor for recurrence.',
  },
  inspect_source: {
    homeowner: 'Moisture indicators are present even if active growth is not clearly visible. Inspect the leak, condensation, or humidity source and keep the material dry.',
    professional: 'Moisture indicators are present without strong visual colony confirmation. Inspect for leak, condensation, or elevated humidity source.',
  },
  collect_more_data: {
    homeowner: 'The current evidence is limited or mixed. Collect clearer images and more field context before drawing stronger conclusions.',
    professional: 'Inputs are incomplete, low quality, or workflow-gated. Obtain clearer images and additional field data before escalation.',
  },
  targeted_inspection: {
    homeowner: 'Visible patterns are consistent with possible active growth and warrant closer inspection of the area and nearby materials.',
    professional: 'Visual and/or IAQ indicators support a targeted inspection of the affected area and adjacent materials.',
  },
  prompt_inspection: {
    homeowner: 'The pattern suggests likely active growth associated with moisture or a favorable material. Arrange prompt inspection.',
    professional: 'Combined indicators support likely active growth with substrate or recurrence support. Prompt inspection is recommended.',
  },
  professional_inspection: {
    homeowner: 'Multiple indicators raise concern for active indoor amplification or ongoing colony growth. Professional inspection is recommended.',
    professional: 'Multiple high-signal indicators are present and support escalation to professional inspection.',
  },
  contain_and_inspect: {
    homeowner: 'This case scores in the highest concern range. Limit disturbance of the area and arrange professional inspection and remediation planning.',
    professional: 'Highest concern pathway triggered. Limit disturbance, contain as appropriate, and proceed to professional inspection/remediation planning.',
  },
};

export function getMessages(actionCode: ActionCode): MessagePair {
  return MESSAGE_MAP[actionCode];
}
