// Unit tests for the vNext.1 deterministic triage engine.
// Each test corresponds to one scenario in the Control Center sheet of the
// source-of-truth Excel workbook.
// Run with: deno test --allow-read engine/__tests__/runTriage.test.ts

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { runTriage } from '../runTriage.ts';
import scenarios from './fixtures/scenarios.json' with { type: 'json' };

for (const scenario of scenarios) {
  Deno.test(`${scenario.scenario_id} — ${scenario.scenario_name}`, () => {
    const out = runTriage(scenario.input as Parameters<typeof runTriage>[0]);
    const e = scenario.expected;

    assertEquals(out.multiple_indicators_count, e.multiple_indicators_count,
      `multiple_indicators_count`);
    assertEquals(out.decision_tree.output, e.decision_tree_output,
      `decision_tree.output`);
    assertEquals(out.decision_tree.action_code, e.decision_tree_action,
      `decision_tree.action_code`);
    assertEquals(out.iaq.risk_band, e.iaq_risk_band,
      `iaq.risk_band`);
    assertEquals(out.final.final_action_code, e.final_action_code,
      `final.final_action_code`);
    assertEquals(out.final.review_gate_triggered, e.review_gate_triggered,
      `final.review_gate_triggered`);
  });
}
