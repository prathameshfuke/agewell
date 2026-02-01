-- Create Admin User (Caregiver Role)

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID := '00000000-0000-0000-0000-000000000001';
    user_email TEXT := 'admin@agewell.com';
    user_password TEXT := 'password123';
    encrypted_pw TEXT;
BEGIN
    -- Hash the password
    encrypted_pw := crypt(user_password, gen_salt('bf'));

    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', -- Supabase default instance_id
            new_user_id,
            'authenticated',
            'authenticated',
            user_email,
            encrypted_pw,
            NOW(), -- Auto-confirm email
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "Admin User", "name": "Admin"}',
            NOW(),
            NOW(),
            '',
            ''
        );
    ELSE
        -- Update password if user exists (Optional, useful for reset)
        UPDATE auth.users 
        SET encrypted_password = encrypted_pw 
        WHERE email = user_email;
        
        -- Get the existing ID
        SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
    END IF;

    -- 2. Insert/Update public.profiles
    -- Triggers might have created it, but we enforce role = 'caregiver'
    INSERT INTO public.profiles (id, role, full_name, avatar_url)
    VALUES (
        new_user_id, 
        'caregiver', 
        'Admin User',
        'https://ui-avatars.com/api/?name=Admin+User&background=random'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'caregiver'; 

END $$;
