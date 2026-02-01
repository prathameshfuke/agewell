-- CONFIRM EMAIL AND ASSIGN ROLE
-- Run this in Supabase SQL Editor

-- 1. Confirm Email
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admin@agewell.com';

-- 2. Ensure Profile exists and has Caregiver Role
DO $$ 
DECLARE
    target_email TEXT := 'admin@agewell.com';
    user_id UUID;
    _roles_column_exists BOOLEAN;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User % not found. Signup might have failed completely.', target_email;
        RETURN;
    END IF;

    -- Check Schema Version
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'roles'
    ) INTO _roles_column_exists;

    -- Update Profile (or Insert if missing)
    IF _roles_column_exists THEN
        INSERT INTO public.profiles (id, full_name, avatar_url, roles, active_role, onboarding_caregiver_completed)
        VALUES (
            user_id, 
            'Admin User', 
            'https://ui-avatars.com/api/?name=Admin+User&background=random',
            ARRAY['caregiver'], 
            'caregiver', 
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            roles = array_append(profiles.roles, 'caregiver'),
            active_role = 'caregiver',
            onboarding_caregiver_completed = true;
            
        -- Clean up duplicate roles
        UPDATE public.profiles 
        SET roles = ARRAY(SELECT DISTINCT unnest(roles))
        WHERE id = user_id;
    ELSE
        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES (
            user_id, 
            'Admin User', 
            'https://ui-avatars.com/api/?name=Admin+User&background=random',
            'caregiver'
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'caregiver';
    END IF;

    RAISE NOTICE 'SUCCESS: Email confirmed and Role assigned for %', target_email;
END $$;
