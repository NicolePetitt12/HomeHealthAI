import type { TriageOutput, VisualFeatures, ActionCode } from '../types.ts';

type RiskLevel = 'low' | 'moderate' | 'high';
type ProfessionalType = 'inspector' | 'remediation' | 'plumber' | 'hvac' | null;
type RejectionReason = 'low_quality' | 'non_mold' | 'out_of_scope' | null;

// Derives UI-facing columns from TriageOutput + visual features so the mobile
// app continues reading from the same analysis_results columns without changes.
export function toAnalysisRow(triage: TriageOutput, features: VisualFeatures) {
  return {
    // ── Core triage payload (source-of-truth) ──────────────────────────────
    triage_payload: triage,

    // ── risk_level: map from IAQ risk_band ────────────────────────────────
    risk_level: mapRiskLevel(triage.iaq.risk_band),

    // ── confidence: normalized_risk_score rounded to integer ───────────────
    confidence: Math.round(triage.iaq.normalized_risk_score),

    // ── UI display fields derived from triage output ───────────────────────
    likely_issue: mapLikelyIssue(triage),
    description: triage.messages.homeowner,
    recommendation_title: mapRecommendationTitle(triage.final.final_action_code),
    recommendations: mapRecommendations(triage),
    explanation: triage.messages.professional,
    next_steps: mapNextSteps(triage),

    // ── Professional type from final action code ───────────────────────────
    suggested_professional_type: mapProfessionalType(triage.final.final_action_code),

    // ── Rejection reason from review gate + image quality ─────────────────
    rejection_reason: mapRejectionReason(triage, features),

    // ── Mold identification from vision (UI backwards compat) ─────────────
    suspected_mold_type: features.suspected_mold_type,
    suspected_mold_description: features.suspected_mold_description,
    mold_candidates: features.mold_candidates,

    // ── Findings derived from reason codes ────────────────────────────────
    findings: mapFindings(triage),
  };
}

function mapRiskLevel(band: string): RiskLevel {
  if (band === 'elevated' || band === 'high_concern') return 'high';
  if (band === 'moderate' || band === 'guarded') return 'moderate';
  return 'low';
}

function mapLikelyIssue(triage: TriageOutput): string {
  if (triage.final.review_gate_triggered) return 'More Info Needed';
  const action = triage.final.final_action_code;
  if (action === 'contain_and_inspect') return 'Mold Suspected — Urgent';
  if (action === 'professional_inspection') return 'Mold Suspected';
  if (action === 'prompt_inspection') return 'Likely Active Growth';
  if (action === 'targeted_inspection') return 'Mold Possible';
  if (action === 'inspect_source') return 'Moisture Concern';
  if (action === 'clean_monitor') return 'Surface Residue';
  return 'No Mold Detected';
}

function mapRecommendationTitle(action: ActionCode): string {
  const titles: Record<ActionCode, string> = {
    educate_monitor:         'Keep Monitoring',
    clean_monitor:           'Clean and Monitor',
    inspect_source:          'Find the Moisture Source',
    collect_more_data:       'Better Image Needed',
    targeted_inspection:     'Inspection Recommended',
    prompt_inspection:       'Act Soon',
    professional_inspection: 'Professional Inspection Needed',
    contain_and_inspect:     'Immediate Action Required',
  };
  return titles[action];
}

function mapRecommendations(triage: TriageOutput): string[] {
  const recs: string[] = [triage.messages.homeowner];
  // Append reason-code-derived hints
  if (triage.final.reason_codes.includes('humidity_elevated')) {
    recs.push('Use a dehumidifier or improve ventilation to reduce indoor humidity below 60%.');
  }
  if (triage.final.reason_codes.includes('porous_surface_growth')) {
    recs.push('Porous materials like drywall or wood may need to be removed and replaced if contaminated.');
  }
  if (triage.final.reason_codes.includes('recurring_issue_present')) {
    recs.push('The issue has recurred — the moisture source must be identified and corrected, not just the surface cleaned.');
  }
  return recs;
}

function mapNextSteps(triage: TriageOutput): string[] {
  const steps: string[] = [triage.messages.professional];
  if (triage.iaq.risk_band === 'elevated' || triage.iaq.risk_band === 'high_concern') {
    steps.push('Document the affected area with photos before disturbing it.');
    steps.push('Limit occupant exposure to the area until the source is identified.');
  }
  return steps;
}

function mapProfessionalType(action: ActionCode): ProfessionalType {
  if (action === 'contain_and_inspect' || action === 'professional_inspection') return 'remediation';
  if (action === 'prompt_inspection' || action === 'targeted_inspection') return 'inspector';
  if (action === 'inspect_source') return 'plumber';
  return null;
}

function mapRejectionReason(triage: TriageOutput, features: VisualFeatures): RejectionReason {
  if (features.image_quality_status === 'poor') return 'low_quality';
  if (triage.final.review_gate_triggered && features.image_quality_status === 'limited') return 'low_quality';
  return null;
}

function mapFindings(triage: TriageOutput): Array<{
  type: string;
  description: string;
  location: string | null;
  severity: string | null;
}> {
  const findings = [];
  const codes = triage.final.reason_codes;

  if (codes.includes('visible_growth_absent')) {
    findings.push({ type: 'No Visible Growth', description: 'No active mold colonies were visually identified in this image.', location: null, severity: 'low' });
  }
  if (codes.includes('porous_surface_growth')) {
    findings.push({ type: 'Growth on Porous Surface', description: 'Visible growth pattern on an absorbent material raises concern for active colonization.', location: null, severity: 'high' });
  }
  if (codes.includes('visible_moisture_present')) {
    findings.push({ type: 'Moisture Detected', description: 'Visible moisture, staining, or wet zones are present in the image.', location: null, severity: 'moderate' });
  }
  if (codes.includes('hard_surface_residue_likely')) {
    findings.push({ type: 'Surface Residue', description: 'Spots on a hard surface may be growing on dust or soap film rather than the substrate.', location: null, severity: 'low' });
  }
  if (codes.includes('humidity_elevated')) {
    findings.push({ type: 'Elevated Humidity', description: 'Humidity level is above the threshold that supports mold growth.', location: null, severity: 'moderate' });
  }
  if (findings.length === 0) {
    findings.push({ type: 'No Concerning Signs', description: 'No strong visual indicators of active mold growth or moisture were detected.', location: null, severity: 'low' });
  }
  return findings;
}
