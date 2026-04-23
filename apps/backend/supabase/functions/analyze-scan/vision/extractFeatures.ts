import OpenAI from 'https://esm.sh/openai@4';
import type { VisualFeatures } from '../types.ts';
import { VISION_SYSTEM_PROMPT } from './visionPrompt.ts';
import { VISION_JSON_SCHEMA } from './visionSchema.ts';

interface ScanContext {
  location?: string | null;
  notes?: string | null;
}

// Sends the image to OpenAI GPT-4o Vision and returns the visual feature set.
// The LLM only extracts visual observations — all scoring happens in the engine.
export async function extractFeatures(
  imageDataUrl: string,
  scan: ScanContext,
): Promise<VisualFeatures> {
  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

  const contextLines = [
    scan.location ? `Location: ${scan.location}` : null,
    scan.notes ? `Homeowner notes: ${scan.notes}` : null,
    'Analyze this image and return only the visual feature JSON.',
  ].filter(Boolean).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'visual_features',
        schema: VISION_JSON_SCHEMA,
        strict: true,
      },
    },
    messages: [
      { role: 'system', content: VISION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
          { type: 'text', text: contextLines },
        ],
      },
    ],
    max_tokens: 600,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty response from vision model');

  const parsed = JSON.parse(raw) as VisualFeatures;
  console.log(
    `[vision] extracted: growth=${parsed.visible_growth_present}, porosity=${parsed.surface_porosity}, quality=${parsed.image_quality_status}`,
  );

  return parsed;
}
