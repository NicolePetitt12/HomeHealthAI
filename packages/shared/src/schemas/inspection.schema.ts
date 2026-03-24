import { z } from 'zod';

// ----- Enums (match Postgres enum types) -----

export const RiskLevel = z.enum(['low', 'moderate', 'high']);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const UserRole = z.enum(['homeowner', 'property_manager', 'renter', 'professional']);
export type UserRole = z.infer<typeof UserRole>;

export const ScanStatus = z.enum(['pending', 'processing', 'completed', 'failed']);
export type ScanStatus = z.infer<typeof ScanStatus>;

export const ProfessionalType = z.enum(['inspector', 'remediation', 'plumber', 'hvac']);
export type ProfessionalType = z.infer<typeof ProfessionalType>;

export const ReferralStatus = z.enum(['pending', 'accepted', 'declined', 'completed']);
export type ReferralStatus = z.infer<typeof ReferralStatus>;

// ----- Profile -----

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: UserRole,
  phone: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = ProfileSchema.pick({
  fullName: true,
  phone: true,
  avatarUrl: true,
  role: true,
}).partial();
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ----- Scan -----

export const ScanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  imagePath: z.string().min(1),
  location: z.string().min(1),
  notes: z.string().nullable(),
  status: ScanStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Scan = z.infer<typeof ScanSchema>;

export const CreateScanSchema = ScanSchema.pick({
  location: true,
  notes: true,
});
export type CreateScan = z.infer<typeof CreateScanSchema>;

// ----- Analysis Result -----

export const FindingSchema = z.object({
  type: z.string(),
  description: z.string(),
  location: z.string().optional(),
  severity: RiskLevel.optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const AnalysisResultSchema = z.object({
  id: z.string().uuid(),
  scanId: z.string().uuid(),
  riskLevel: RiskLevel,
  confidence: z.number().min(0).max(1),
  findings: z.array(FindingSchema),
  explanation: z.string().nullable(),
  nextSteps: z.array(z.string()),
  modelVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ----- Professional -----

export const ProfessionalSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  businessName: z.string().min(1),
  professionalType: ProfessionalType,
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),
  description: z.string().nullable(),
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Professional = z.infer<typeof ProfessionalSchema>;

// ----- Referral -----

export const ReferralSchema = z.object({
  id: z.string().uuid(),
  scanId: z.string().uuid(),
  professionalId: z.string().uuid(),
  userId: z.string().uuid(),
  message: z.string().nullable(),
  status: ReferralStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Referral = z.infer<typeof ReferralSchema>;

export const CreateReferralSchema = ReferralSchema.pick({
  scanId: true,
  professionalId: true,
  message: true,
});
export type CreateReferral = z.infer<typeof CreateReferralSchema>;
