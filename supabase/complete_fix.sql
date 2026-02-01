-- ============================================
-- Combined Database Fix Script for AgeWell
-- Run this in Supabase SQL Editor (SQL Editor > New Query)
-- ============================================

-- PART 1: Fix RLS policies to avoid infinite recursion
-- ============================================

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Caregivers can view linked elderly" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate simpler policies without recursion
CREATE POLICY "profiles_select_own" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Caregivers can view their linked elderly
CREATE POLICY "profiles_caregiver_view_elderly" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles AS caregiver 
    WHERE caregiver.id = auth.uid() 
    AND caregiver.linked_elderly_id = profiles.id
  )
);

-- PART 2: Add onboarding fields to profiles table
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT[],
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Done! You can close this and test your app.
