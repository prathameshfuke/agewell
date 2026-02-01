-- FINAL ROBUST ADMIN SETUP
-- Run this in Supabase SQL Editor

-- 1. Enable key extensions safely
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create User and Handle Profile dynamically
DO $$
DECLARE
    target_email TEXT := 'admin@agewell.com';
    target_password TEXT := 'password123';
    new_user_id UUID;
    encrypted_pw TEXT;
    _roles_column_exists BOOLEAN;
BEGIN
    -- A. Create/Update Auth User
    encrypted_pw := crypt(target_password, gen_salt('bf'));
    
    SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;

    IF new_user_id IS NULL THEN
        new_user_id := uuid_generate_v4();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
            target_email, encrypted_pw, NOW(), 
            '{"provider": "email", "providers": ["email"]}', 
            '{"full_name": "Admin User"}', 
            NOW(), NOW()
        );
        RAISE NOTICE 'User created: %', new_user_id;
    ELSE
        UPDATE auth.users 
        SET encrypted_password = encrypted_pw 
        WHERE id = new_user_id;
        RAISE NOTICE 'User updated: %', new_user_id;
    END IF;

    -- B. Upsert Profile (Handling Schema Variations)
    
    -- Check if 'roles' column exists (New Schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'roles'
    ) INTO _roles_column_exists;

    -- Upsert based on schema detection
    IF _roles_column_exists THEN
        -- NEW SCHEMA: Use 'roles' array and 'active_role'
        INSERT INTO public.profiles (
            id, full_name, avatar_url, roles, active_role, 
            onboarding_caregiver_completed
        )
        VALUES (
            new_user_id, 'Admin User', 
            'https://ui-avatars.com/api/?name=Admin+User&background=random',
            ARRAY['caregiver'], 'caregiver', true
        )
        ON CONFLICT (id) DO UPDATE SET
            roles = array_append(profiles.roles, 'caregiver'), -- Append if not present (simplified)
            active_role = 'caregiver',
            onboarding_caregiver_completed = true;
            
        -- Clean up duplicate roles just in case
        UPDATE public.profiles 
        SET roles = ARRAY(SELECT DISTINCT unnest(roles))
        WHERE id = new_user_id;
        
    ELSE
        -- OLD SCHEMA: Use 'role' column
        INSERT INTO public.profiles (id, full_name, avatar_url, role)
        VALUES (
            new_user_id, 'Admin User', 
            'https://ui-avatars.com/api/?name=Admin+User&background=random',
            'caregiver'
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'caregiver';
    END IF;

    RAISE NOTICE 'Admin Setup Complete.';
END $$;
