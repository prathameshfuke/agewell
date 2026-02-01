-- STEP 1: Make role column nullable (if not already done)
ALTER TABLE profiles 
ALTER COLUMN role DROP NOT NULL;

-- STEP 2: Remove the default value
ALTER TABLE profiles 
ALTER COLUMN role DROP DEFAULT;

-- STEP 3: Update the trigger to NOT insert role
-- This means new users will have NULL role and must select one
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile WITHOUT setting role - user must select it
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Verify the changes
SELECT id, full_name, role FROM profiles;

-- STEP 5: Reset ALL existing profiles to NULL role for testing
-- Comment this out if you don't want to reset existing users
-- UPDATE profiles SET role = NULL;
