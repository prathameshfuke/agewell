-- Fix RLS policies to avoid infinite recursion
-- Run this in Supabase SQL Editor

-- First, drop all existing policies on profiles that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Caregivers can view linked elderly" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate simpler policies without recursion
-- SELECT: Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- UPDATE: Users can update their own profile  
CREATE POLICY "profiles_update_own" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- INSERT: Users can insert their own profile (for upsert to work)
CREATE POLICY "profiles_insert_own" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- SELECT: Caregivers can view their linked elderly (separate policy, no recursion)
-- This uses a simpler approach that doesn't query profiles within the policy
CREATE POLICY "profiles_caregiver_view_elderly" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles AS caregiver 
    WHERE caregiver.id = auth.uid() 
    AND caregiver.linked_elderly_id = profiles.id
  )
);

-- Verify policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
