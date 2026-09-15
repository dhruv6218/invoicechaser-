-- ============================================================
-- Astrix AI — Admin User Setup
-- Run this in Supabase SQL Editor AFTER creating your admin account
-- via the /godview admin signup page.
--
-- STEP 1: Sign up an admin account at your-app.com/godview
--         (Use a strong password!)
-- STEP 2: Find your user ID below OR just use the email approach
-- STEP 3: Run one of the following commands:
-- ============================================================

-- OPTION A: Set admin by email (recommended)
-- Replace 'your-admin@email.com' with the email you signed up with
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your-admin@email.com';

-- OPTION B: Set admin by user ID (from Supabase Dashboard > Authentication > Users)
-- UPDATE public.profiles
-- SET is_admin = true
-- WHERE id = 'your-user-uuid-here';

-- Verify it worked:
-- SELECT id, email, full_name, is_admin FROM public.profiles WHERE is_admin = true;

-- To REMOVE admin access later:
-- UPDATE public.profiles SET is_admin = false WHERE email = 'your-admin@email.com';
