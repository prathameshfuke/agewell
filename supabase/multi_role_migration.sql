

-- STEP 1: Add new columns for multi-role support
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS active_role TEXT CHECK (active_role IN ('elderly', 'caregiver')),
ADD COLUMN IF NOT EXISTS onboarding_elder_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_caregiver_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- STEP 2: Make role column nullable (if not already)
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- STEP 3: Migrate existing users (grandfather them in)
-- If they had a role, add it to roles array and mark onboarding as complete
UPDATE profiles 
SET 
  roles = CASE 
    WHEN role IS NOT NULL THEN ARRAY[role]
    ELSE '{}'
  END,
  active_role = role,
  onboarding_elder_completed = CASE 
    WHEN role = 'elderly' THEN COALESCE(onboarding_completed, true)
    ELSE false 
  END,
  onboarding_caregiver_completed = CASE 
    WHEN role = 'caregiver' THEN COALESCE(onboarding_completed, true)
    ELSE false 
  END
WHERE roles = '{}' OR roles IS NULL;

-- STEP 4: Update the trigger for new users (NO default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url, 
    roles, 
    active_role,
    onboarding_elder_completed,
    onboarding_caregiver_completed,
    login_attempts
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    '{}',   -- Empty roles array - user must select
    NULL,   -- No active role - user must select
    false,  -- Elder onboarding not completed
    false,  -- Caregiver onboarding not completed
    0       -- No login attempts
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Update RLS policies
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_write_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_write_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 7: Verify the migration
SELECT 
  id, 
  full_name, 
  role as old_role,
  roles,
  active_role,
  onboarding_elder_completed,
  onboarding_caregiver_completed
FROM profiles;
