-- =============================================================
-- Seed data for Inspector Gnome MVP development
-- WARNING: Local dev only — do NOT apply to production
-- =============================================================

-- Test user UUIDs:
--   Homeowner:    00000000-0000-0000-0000-000000000001  (homeowner@test.com / password123)
--   Professional: 00000000-0000-0000-0000-000000000002  (pro@test.com / password123)

-- -------------------------------------------------------
-- 1. Create test auth users
--    The handle_new_user trigger will auto-create profiles
-- -------------------------------------------------------
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'homeowner@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"full_name": "Test Homeowner"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'pro@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"full_name": "Mike the Inspector"}'::jsonb,
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

-- Update the professional user's role (trigger sets it to 'homeowner' by default)
UPDATE public.profiles
SET role = 'professional'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- -------------------------------------------------------
-- 2. Professionals directory
-- -------------------------------------------------------
INSERT INTO public.professionals (id, user_id, business_name, professional_type, email, phone, city, state, zip_code, description, is_verified) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'MoldBusters Inc.',
    'inspector',
    'info@moldbusters.test', '555-0101',
    'Austin', 'TX', '78701',
    'Certified mold inspector with 10+ years of residential and commercial experience.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    NULL,
    'CleanAir Remediation',
    'remediation',
    'contact@cleanair.test', '555-0102',
    'Austin', 'TX', '78702',
    'Licensed mold remediation and water damage restoration company.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    NULL,
    'ProPlumb Solutions',
    'plumber',
    'hello@proplumb.test', '555-0103',
    'Austin', 'TX', '78703',
    'Leak detection and pipe repair specialists.',
    false
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    NULL,
    'CoolFlow HVAC',
    'hvac',
    'service@coolflow.test', '555-0104',
    'Austin', 'TX', '78704',
    'HVAC maintenance, humidity control, and ventilation improvement.',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 3. Sample scan (completed)
-- -------------------------------------------------------
INSERT INTO public.scans (id, user_id, image_path, location, notes, status) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001/b0000000-0000-0000-0000-000000000001.jpg',
    'Bathroom ceiling',
    'Dark spots appeared after heavy rain last week.',
    'completed'
  )
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 4. Sample analysis result (moderate risk, 78% confidence)
-- -------------------------------------------------------
INSERT INTO public.analysis_results (id, scan_id, risk_level, confidence, findings, explanation, next_steps, model_version) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'moderate',
    0.7800,
    '[
      {
        "type": "dark_discoloration",
        "description": "Dark circular patches consistent with mold growth",
        "location": "upper-left quadrant",
        "severity": "moderate"
      }
    ]'::jsonb,
    'The image shows dark discoloration on the ceiling consistent with mold growth, likely caused by moisture intrusion. This pattern is commonly seen after water leaks or prolonged humidity exposure.',
    ARRAY[
      'Monitor the area for changes over the next 2 weeks',
      'Improve bathroom ventilation — run the fan during and after showers',
      'Check for plumbing leaks above the ceiling',
      'Keep humidity below 50% with a dehumidifier if needed',
      'Consider a professional mold inspection if spots expand'
    ],
    'inspector-gnome-v1.0'
  )
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 5. Sample referral (pending)
-- -------------------------------------------------------
INSERT INTO public.referrals (id, scan_id, professional_id, user_id, message, status) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'I found what looks like mold on my bathroom ceiling after heavy rain. Inspector Gnome rated it moderate risk. Can you come inspect?',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;
