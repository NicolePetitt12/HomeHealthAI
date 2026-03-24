import { z } from 'zod';

export const RiskLevel = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const InspectionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  location: z.string().min(1),
  notes: z.string().optional(),
  riskLevel: RiskLevel.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Inspection = z.infer<typeof InspectionSchema>;

export const CreateInspectionSchema = InspectionSchema.omit({
  id: true,
  userId: true,
  riskLevel: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateInspection = z.infer<typeof CreateInspectionSchema>;
