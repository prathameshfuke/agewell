-- DISABLE TRIGGERS AND RLS FOR DEBUGGING
-- Run this in Supabase SQL Editor

-- 1. Disable the trigger that handles new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verify if RLS is causing issues by temporarily disabling it on profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. (Optional) Re-enable purely enabling extensions to be sure
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
