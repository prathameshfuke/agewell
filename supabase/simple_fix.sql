-- ============================================
-- VERIFY AND FIX - Run this in Supabase SQL Editor
-- This script handles the case where some policies already exist
-- ============================================

-- First, let's see what policies currently exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Drop ALL policies and recreate them cleanly
DO $$
BEGIN
    -- Drop all existing policies on profiles (ignore errors if they don't exist)
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Caregivers can view linked elderly" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_caregiver_view_elderly" ON profiles;
    DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_write_own" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert" ON profiles;
END $$;

-- Now create fresh policies
CREATE POLICY "profiles_read_own" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_write_own" ON profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Add onboarding columns if not exists  
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Verify the final state
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
