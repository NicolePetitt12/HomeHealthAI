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

export const RejectionReason = z.enum(['low_quality', 'non_mold', 'out_of_scope']);
export type RejectionReason = z.infer<typeof RejectionReason>;

export const MoldCandidateSchema = z.object({
  type: z.string(),
  description: z.string(),
  confidence: z.number().int().min(0).max(100),
});
export type MoldCandidate = z.infer<typeof MoldCandidateSchema>;

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
  confidence: z.number().int().min(0).max(100),
  findings: z.array(FindingSchema),
  explanation: z.string().nullable(),
  nextSteps: z.array(z.string()),
  modelVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
  // UI display fields (populated by Edge Function)
  likelyIssue: z.string().nullable(),
  description: z.string().nullable(),
  recommendationTitle: z.string().nullable(),
  recommendations: z.array(z.string()).nullable(),
  suggestedProfessionalType: ProfessionalType.nullable(),
  suspectedMoldType: z.string().nullable(),
  suspectedMoldDescription: z.string().nullable(),
  moldCandidates: z.array(MoldCandidateSchema),
  rejectionReason: RejectionReason.nullable(),
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

// ----- Subscription Enums -----

export const SubscriptionStatus = z.enum([
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const PlanTier = z.enum(['free', 'home', 'pro']);
export type PlanTier = z.infer<typeof PlanTier>;

// ----- Customer -----

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  stripeCustomerId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Customer = z.infer<typeof CustomerSchema>;

// ----- Subscription -----

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  stripeSubscriptionId: z.string(),
  stripePriceId: z.string(),
  planTier: PlanTier,
  status: SubscriptionStatus,
  currentPeriodStart: z.string().datetime().nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ----- Invoice -----

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  stripeInvoiceId: z.string(),
  stripeSubscriptionId: z.string().nullable(),
  amountPaid: z.number(),
  currency: z.string(),
  status: z.string(),
  invoiceUrl: z.string().nullable(),
  periodStart: z.string().datetime().nullable(),
  periodEnd: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// ----- Plan (returned by get-plans Edge Function) -----

export const PlanSchema = z.object({
  appPlanId: z.enum(['home', 'pro']),
  name: z.string(),
  description: z.string(),
  priceId: z.string(),
  unitAmount: z.number(),
  currency: z.string(),
  interval: z.string(),
});
export type Plan = z.infer<typeof PlanSchema>;

// ----- Entitlement (derived, not persisted) -----

export const EntitlementSchema = z.object({
  planTier: PlanTier,
  scansUsedThisMonth: z.number(),
  scansAllowedThisMonth: z.number(), // -1 = unlimited
  canScan: z.boolean(),
  subscriptionStatus: SubscriptionStatus.nullable(),
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  quotaPeriodStart: z.string().datetime().nullable().optional(),
  quotaPeriodEnd: z.string().datetime().nullable().optional(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

// ----- Notifications -----

export const NotificationType = z.enum([
  'scan_completed',
  'subscription_changed',
  'app_update',
  'promotion',
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationType,
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationPreferencesSchema = z.object({
  userId: z.string().uuid(),
  pushEnabled: z.boolean(),
  scanCompleted: z.boolean(),
  subscriptionChanged: z.boolean(),
  appUpdate: z.boolean(),
  promotion: z.boolean(),
  updatedAt: z.string().datetime(),
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
