-- Migration: Add missing caregiver onboarding columns to profiles table
-- Run this in Supabase SQL Editor

-- Add caregiver_relationship column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'caregiver_relationship') THEN
        ALTER TABLE profiles ADD COLUMN caregiver_relationship TEXT;
    END IF;
END $$;

-- Add notifications_enabled column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'notifications_enabled') THEN
        ALTER TABLE profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
