import type { AnalysisResult, ProfessionalType, RiskLevel } from '@inspector-gnome/shared';

export interface ResultsViewData extends AnalysisResult {
  /** Short headline: what the AI likely detected */
  likelyIssue: string;
  /** Professional type to recommend, or null when none needed */
  suggestedProfessionalType: ProfessionalType | null;
}

const MOCK_HIGH: ResultsViewData = {
  id: '00000000-0000-0000-0000-000000000001',
  scanId: '00000000-0000-0000-0000-000000000010',
  riskLevel: 'high',
  confidence: 0.92,
  likelyIssue: 'Active Mold Growth Detected',
  explanation:
    "I can see what looks like active mold growth in this area. The dark discoloration and texture pattern are consistent with mold colonies, likely caused by sustained moisture exposure. This needs attention soon — the longer it goes untreated, the more it spreads.",
  findings: [
    {
      type: 'Active Mold',
      description: 'Dark colony growth visible on surface, consistent with Cladosporium or Aspergillus species.',
      location: 'Center of frame',
      severity: 'high',
    },
    {
      type: 'Moisture Damage',
      description: 'Staining and surface deterioration indicate prolonged water exposure.',
      location: 'Along lower edge',
      severity: 'high',
    },
    {
      type: 'Structural Concern',
      description: 'Material appears compromised — may require replacement, not just cleaning.',
      severity: 'moderate',
    },
  ],
  nextSteps: [
    'Do not disturb the area — avoid scrubbing or vacuuming, which can spread spores',
    'Seal off the area with plastic sheeting if possible until professionally remediated',
    'Identify and fix the moisture source (leak, condensation, or flooding)',
    'Contact a certified mold remediation specialist for assessment',
    'Consider air quality testing if anyone in the home has respiratory sensitivities',
  ],
  suggestedProfessionalType: 'remediation',
  modelVersion: 'mock-v0',
  createdAt: new Date().toISOString(),
};

const MOCK_MODERATE: ResultsViewData = {
  id: '00000000-0000-0000-0000-000000000002',
  scanId: '00000000-0000-0000-0000-000000000010',
  riskLevel: 'moderate',
  confidence: 0.74,
  likelyIssue: 'Moisture Staining & Early Warning Signs',
  explanation:
    "I found moisture staining that suggests this area has been wet at some point — possibly from a slow leak, condensation, or flooding. There are early indicators that mold could develop if the moisture source is not addressed. The good news: catching it at this stage means you have options before it becomes a bigger problem.",
  findings: [
    {
      type: 'Moisture Staining',
      description: 'Discoloration consistent with water intrusion. Likely from a recurring source rather than a one-time event.',
      location: 'Upper left quadrant',
      severity: 'moderate',
    },
    {
      type: 'Surface Efflorescence',
      description: 'White mineral deposits on surface, indicating water has passed through the material repeatedly.',
      severity: 'low',
    },
  ],
  nextSteps: [
    'Find and fix the moisture source before treating the surface',
    'Improve ventilation in this area — use a fan or open windows regularly',
    'Clean the stained area with a diluted bleach solution (1 cup per gallon of water)',
    'Monitor the area over the next 2–4 weeks for any new growth',
    'Consider a professional inspection if moisture reappears',
  ],
  suggestedProfessionalType: 'inspector',
  modelVersion: 'mock-v0',
  createdAt: new Date().toISOString(),
};

const MOCK_LOW: ResultsViewData = {
  id: '00000000-0000-0000-0000-000000000003',
  scanId: '00000000-0000-0000-0000-000000000010',
  riskLevel: 'low',
  confidence: 0.88,
  likelyIssue: 'No Significant Concerns Found',
  explanation:
    "Good news — I did not find any clear signs of active mold or serious moisture damage in this photo. The area looks generally dry and clean. Keep up with regular ventilation and you should be in good shape.",
  findings: [
    {
      type: 'Minor Dust / Debris',
      description: 'Some surface dust present, but no indicators of biological growth.',
      severity: 'low',
    },
  ],
  nextSteps: [
    'Keep the area well-ventilated, especially after showers or cooking',
    'Maintain indoor humidity below 60% — use a dehumidifier if needed',
    'Re-scan in 3–6 months or any time you notice new discoloration or odors',
  ],
  suggestedProfessionalType: null,
  modelVersion: 'mock-v0',
  createdAt: new Date().toISOString(),
};

const MOCKS: Record<RiskLevel, ResultsViewData> = {
  high: MOCK_HIGH,
  moderate: MOCK_MODERATE,
  low: MOCK_LOW,
};

export function getMockAnalysis(riskLevel: RiskLevel = 'moderate'): ResultsViewData {
  return MOCKS[riskLevel];
}
