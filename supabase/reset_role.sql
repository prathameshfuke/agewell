-- Fix: Allow NULL values in role column for role selection flow
-- Run this in Supabase SQL Editor

-- Remove the NOT NULL constraint and default value from role
ALTER TABLE profiles 
ALTER COLUMN role DROP NOT NULL,
ALTER COLUMN role DROP DEFAULT;

-- Now you can reset your role:
UPDATE profiles SET role = NULL;

-- Verify
SELECT id, full_name, role FROM profiles;
