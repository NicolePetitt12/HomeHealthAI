// OpenAI Structured Outputs schema for visual feature extraction.
// Strict mode: all fields required, no additional properties.
// Only covers the ~13 visual fields the LLM can observe from the image.

export const VISION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'room_type',
    'surface_type',
    'surface_porosity',
    'visible_color',
    'visible_texture',
    'growth_pattern',
    'estimated_area_sqft',
    'visible_moisture_present',
    'visible_growth_present',
    'residue_likely',
    'porous_material_wet',
    'image_quality_status',
    'ai_initial_visual_group',
    'suspected_mold_type',
    'suspected_mold_description',
    'mold_candidates',
  ],
  properties: {
    room_type: { type: 'string' },
    surface_type: { type: 'string' },
    surface_porosity: {
      type: 'string',
      enum: ['porous', 'semi_porous', 'non_porous', 'unknown'],
    },
    visible_color: { type: 'string' },
    visible_texture: { type: 'string' },
    growth_pattern: { type: 'string' },
    estimated_area_sqft: { type: ['number', 'null'] },
    visible_moisture_present: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    visible_growth_present: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    residue_likely: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    porous_material_wet: { type: 'string', enum: ['yes', 'no', 'unknown'] },
    image_quality_status: { type: 'string', enum: ['good', 'limited', 'poor'] },
    ai_initial_visual_group: { type: 'string' },
    suspected_mold_type: { type: ['string', 'null'] },
    suspected_mold_description: { type: ['string', 'null'] },
    mold_candidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'description', 'confidence'],
        properties: {
          type: { type: 'string' },
          description: { type: 'string' },
          confidence: { type: 'integer', minimum: 0, maximum: 100 },
        },
      },
    },
  },
} as const;
