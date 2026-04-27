-- Add pdf_path to cache the generated PDF location in Storage (invoices/{user_id}/{invoice_id}.pdf)
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pdf_path text NULL;

-- Freeze the plan tier at invoice time for historical reporting
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS plan_tier plan_tier NULL;

-- Backfill plan_tier from subscriptions for existing invoices
UPDATE public.invoices i
SET plan_tier = s.plan_tier
FROM public.subscriptions s
WHERE i.stripe_subscription_id = s.stripe_subscription_id
  AND i.plan_tier IS NULL;
