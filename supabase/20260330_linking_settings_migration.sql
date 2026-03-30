-- AgeWell migration: role compatibility + caregiver links + app settings
-- Date: 2026-03-30
-- Safe to run in Supabase SQL Editor (idempotent statements where possible)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES compatibility updates
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_elder_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_caregiver_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pairing_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'profiles_pairing_code_unique'
  ) THEN
    CREATE UNIQUE INDEX profiles_pairing_code_unique
      ON profiles(pairing_code)
      WHERE pairing_code IS NOT NULL;
  END IF;
END $$;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('elderly', 'elder', 'caregiver', 'both'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_active_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_active_role_check
  CHECK (active_role IS NULL OR active_role IN ('elderly', 'elder', 'caregiver'));

UPDATE profiles
SET role = 'elderly'
WHERE role = 'elder';

UPDATE profiles
SET active_role = COALESCE(active_role, role)
WHERE active_role IS NULL
  AND role IS NOT NULL;

UPDATE profiles
SET roles = ARRAY[active_role]::TEXT[]
WHERE active_role IS NOT NULL
  AND (roles IS NULL OR array_length(roles, 1) IS NULL);

UPDATE profiles
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE
  AND (
    onboarding_elder_completed = TRUE
    OR onboarding_caregiver_completed = TRUE
  );

-- ============================================
-- CAREGIVER LINKS
-- ============================================
CREATE TABLE IF NOT EXISTS caregiver_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  link_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS caregiver_links_unique_pair
  ON caregiver_links (elder_id, caregiver_id)
  WHERE caregiver_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS caregiver_links_single_pending
  ON caregiver_links (elder_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS caregiver_links_caregiver_status_idx
  ON caregiver_links (caregiver_id, status);

CREATE INDEX IF NOT EXISTS caregiver_links_elder_status_idx
  ON caregiver_links (elder_id, status);

-- ============================================
-- APP SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- ============================================
-- RLS + helper functions
-- ============================================
ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_linked_elderly_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT cl.elder_id
      FROM public.caregiver_links cl
      WHERE cl.caregiver_id = auth.uid()
        AND cl.status = 'active'
      ORDER BY cl.linked_at DESC NULLS LAST, cl.created_at DESC
      LIMIT 1
    ),
    (
      SELECT p.linked_elderly_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.caregiver_links cl
        WHERE cl.caregiver_id = auth.uid()
          AND cl.elder_id = target_user_id
          AND cl.status = 'active'
      )
      OR target_user_id = (
        SELECT p.linked_elderly_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
        LIMIT 1
      );
$$;

DROP POLICY IF EXISTS "Caregivers can view linked elders via caregiver_links" ON profiles;
CREATE POLICY "Caregivers can view linked elders via caregiver_links" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM caregiver_links cl
      WHERE cl.elder_id = profiles.id
        AND cl.caregiver_id = auth.uid()
        AND cl.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Participants can view caregiver links" ON caregiver_links;
DROP POLICY IF EXISTS "Elders can create caregiver links" ON caregiver_links;
DROP POLICY IF EXISTS "Elders can update caregiver links" ON caregiver_links;
CREATE POLICY "Participants can view caregiver links" ON caregiver_links FOR SELECT
  USING (elder_id = auth.uid() OR caregiver_id = auth.uid());
CREATE POLICY "Elders can create caregiver links" ON caregiver_links FOR INSERT
  WITH CHECK (elder_id = auth.uid());
CREATE POLICY "Elders can update caregiver links" ON caregiver_links FOR UPDATE
  USING (elder_id = auth.uid())
  WITH CHECK (elder_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete own app settings" ON app_settings;
CREATE POLICY "Users can view own app settings" ON app_settings FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own app settings" ON app_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own app settings" ON app_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own app settings" ON app_settings FOR DELETE
  USING (user_id = auth.uid());

COMMIT;

-- Validation snippets (run after commit)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('roles', 'active_role', 'onboarding_completed');
-- SELECT to_regclass('public.caregiver_links'), to_regclass('public.app_settings');
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('caregiver_links', 'app_settings');
