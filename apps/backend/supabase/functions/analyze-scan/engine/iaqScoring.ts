import type { TriageInput, IaqScores, RiskBand, ActionCode } from '../types.ts';
import { RISK_BAND_ACTION, IAQ_MAX_RAW } from './constants.ts';

// Step 3 — Compute all IAQ component scores and aggregate.

function sporeLoadScore(spores: number | null): number {
  if (spores === null) return 0;
  if (spores < 250)  return 0;
  if (spores < 750)  return 5;
  if (spores < 1500) return 10;
  if (spores < 5000) return 15;
  return 20;
}

function indoorOutdoorRatio(indoor: number | null, outdoor: number | null): number | null {
  if (indoor === null || outdoor === null) return null;
  if (indoor <= 0 || outdoor <= 0) return null;
  return indoor / outdoor;
}

function ratioScore(ratio: number | null): number {
  if (ratio === null) return 0;
  if (ratio < 1.0)  return 0;
  if (ratio < 1.5)  return 5;
  if (ratio < 2.0)  return 10;
  return 15;
}

function markerScore(marker: string): number {
  if (marker === 'yes')                       return 15;
  if (marker === 'unknown' || marker === 'possible') return 7;
  return 0;
}

function mycotoxinScore(mycotoxin: string): number {
  if (mycotoxin === 'yes')                       return 10;
  if (mycotoxin === 'unknown' || mycotoxin === 'possible') return 5;
  return 0;
}

function visibleGrowthScore(growth: string): number {
  if (growth === 'yes')     return 15;
  if (growth === 'unknown') return 7;
  return 0;
}

function porousWetScore(porousWet: string): number {
  if (porousWet === 'yes')     return 10;
  if (porousWet === 'unknown') return 5;
  return 0;
}

function humidityScore(humidity: number | null): number {
  if (humidity === null) return 0;
  if (humidity < 60)  return 0;
  if (humidity < 70)  return 3;
  return 5;
}

function sensitivityScore(sensitivity: string): number {
  if (sensitivity === 'sensitive')       return 3;
  if (sensitivity === 'highly_sensitive') return 5;
  return 0;
}

function riskBand(normalized: number): RiskBand {
  if (normalized < 20)  return 'low';
  if (normalized < 40)  return 'guarded';
  if (normalized < 60)  return 'moderate';
  if (normalized < 80)  return 'elevated';
  return 'high_concern';
}

export function computeIaqScores(input: TriageInput): IaqScores {
  const spore_load_score = sporeLoadScore(input.indoor_total_spores_m3);
  const indoor_outdoor_ratio = indoorOutdoorRatio(input.indoor_total_spores_m3, input.outdoor_total_spores_m3);
  const ratio_score = ratioScore(indoor_outdoor_ratio);
  const marker_score = markerScore(input.marker_mold_present);
  const mycotoxin_score = mycotoxinScore(input.mycotoxin_producer_present);
  const visible_growth_score = visibleGrowthScore(input.visible_growth_present);
  const porous_wet_score = porousWetScore(input.porous_material_wet);
  const humidity_score = humidityScore(input.humidity_percent);
  const sensitivity_score = sensitivityScore(input.occupant_sensitivity);

  const raw_total_score =
    spore_load_score + ratio_score + marker_score + mycotoxin_score +
    visible_growth_score + porous_wet_score + humidity_score + sensitivity_score;

  const normalized_risk_score = Math.round((raw_total_score / IAQ_MAX_RAW) * 100 * 10) / 10;
  const risk_band_value = riskBand(normalized_risk_score);
  const risk_band_action_code: ActionCode = RISK_BAND_ACTION[risk_band_value];

  return {
    spore_load_score,
    indoor_outdoor_ratio,
    ratio_score,
    marker_score,
    mycotoxin_score,
    visible_growth_score,
    porous_wet_score,
    humidity_score,
    sensitivity_score,
    raw_total_score,
    normalized_risk_score,
    risk_band: risk_band_value,
    risk_band_action_code,
  };
}
