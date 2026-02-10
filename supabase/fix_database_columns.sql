-- RUN THIS IN SUPABASE SQL EDITOR TO FIX YOUR DATABASE

-- 1. Add Pairing Code (Unique 6-char code for linking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pairing_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_pairing_code ON profiles(pairing_code);

-- 2. Add Onboarding Fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_elder_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_caregiver_completed BOOLEAN DEFAULT false;

-- 3. Add Caregiver Specific Fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS caregiver_relationship TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- 4. Fix RLS Policies (Allow updates and INSERTS to own profile)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
