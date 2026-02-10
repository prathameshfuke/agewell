-- EMERGENCY FIX: Force onboarding completion for existing users
-- Run this in the Supabase SQL Editor to stop the redirect loop immediately.

UPDATE profiles
SET 
  onboarding_elder_completed = true,
  onboarding_caregiver_completed = true
WHERE 
  onboarding_elder_completed IS NULL OR onboarding_elder_completed = false;

-- Verify the update
SELECT count(*) as fixed_users FROM profiles WHERE onboarding_elder_completed = true;
