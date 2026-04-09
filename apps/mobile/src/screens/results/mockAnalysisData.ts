import type { AnalysisResult, RiskLevel } from '@inspector-gnome/shared';

export type ResultCategory = 'mold_suspected' | 'inconclusive' | 'clean_mold_safely';

export interface ResultsViewData extends AnalysisResult {
  /** Result category for UI rendering (derived from riskLevel) */
  category: ResultCategory;
  // The following fields override the nullable AnalysisResult fields with non-null types
  // (always populated in ResultsViewData, either from DB or from mock fallback)
  likelyIssue: string;
  description: string;
  recommendationTitle: string;
  recommendations: string[];
}

function categoryForRisk(risk: RiskLevel): ResultCategory {
  switch (risk) {
    case 'high': return 'mold_suspected';
    case 'moderate': return 'inconclusive';
    case 'low': return 'clean_mold_safely';
  }
}

const MOCK_HIGH: ResultsViewData = {
  id: '00000000-0000-0000-0000-000000000001',
  scanId: '00000000-0000-0000-0000-000000000010',
  riskLevel: 'high',
  confidence: 0.92,
  category: 'mold_suspected',
  likelyIssue: 'Mold Suspected',
  description: 'AI detects possible mold in the analyzed area.',
  recommendationTitle: 'We recommend',
  recommendations: [
    'We recommend contacting a professional mold remediation service.',
    'Monitor for any new mold growth in the affected area.',
  ],
  suspectedMoldType: 'Stachybotrys chartarum',
  suspectedMoldDescription: 'A toxigenic mold commonly known as "black mold" that thrives in damp environments with cellulose-rich materials.',
  explanation:
    "I can see what looks like active mold growth in this area. The dark discoloration and texture pattern are consistent with mold colonies, likely caused by sustained moisture exposure.",
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
  category: 'inconclusive',
  likelyIssue: 'Inconclusive',
  description: 'AI is unsure about mold presence.',
  recommendationTitle: 'We recommend',
  recommendations: [
    'We recommend re-scanning the area for a clearer result.',
    'Consider having a professional inspect the area for mold.',
  ],
  suspectedMoldType: null,
  suspectedMoldDescription: null,
  explanation:
    "I found moisture staining that suggests this area has been wet at some point — possibly from a slow leak, condensation, or flooding. There are early indicators that mold could develop if the moisture source is not addressed.",
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
  category: 'clean_mold_safely',
  likelyIssue: 'Clean Mold Safely',
  description: 'We recommend cleaning the mold as soon as possible.',
  recommendationTitle: 'Cleaning Guidelines',
  recommendations: [
    'Wear protective gloves and a mask.',
    'Use a solution of detergent and water.',
    'Scrub the moldy area gently.',
    'Dry the area thoroughly after cleaning.',
  ],
  suspectedMoldType: null,
  suspectedMoldDescription: null,
  explanation:
    "Surface mold detected that can be safely cleaned without professional help. The growth appears limited and on a non-porous surface.",
  findings: [
    {
      type: 'Surface Mold',
      description: 'Light surface mold present, appears to be on a non-porous surface that can be cleaned.',
      severity: 'low',
    },
  ],
  nextSteps: [
    'Clean the area using the guidelines above',
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

/** Derive a category from a risk level for real analysis data */
export { categoryForRisk };
