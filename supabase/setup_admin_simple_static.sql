-- SIMPLIFIED ADMIN SETUP (Static UUID)
-- Run this in Supabase SQL Editor

-- 1. Enable crypto (ignore if already exists)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Delete existing admin to start fresh (avoids update logic complexity)
DELETE FROM auth.users WHERE email = 'admin@agewell.com';

-- 3. Insert User with HARDCODED ID
INSERT INTO auth.users (
    id, 
    instance_id, 
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
    recovery_token, 
    is_super_admin
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Static UUID
    '00000000-0000-0000-0000-000000000000', 
    'authenticated', 
    'authenticated', 
    'admin@agewell.com', 
    crypt('password123', gen_salt('bf')), 
    NOW(), 
    '{"provider": "email", "providers": ["email"]}', 
    '{"full_name": "Admin User"}', 
    NOW(), 
    NOW(), 
    '', 
    '', 
    FALSE
);

-- 4. Insert Profile 
-- WE ASSUME THE 'roles' COLUMN EXISTS. 
-- IF THIS FAILS WITH "column 'roles' does not exist", YOU MUST RUN THE MIGRATION FIRST.
INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url, 
    roles, 
    active_role, 
    onboarding_caregiver_completed
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Admin User',
    'https://ui-avatars.com/api/?name=Admin+User&background=random',
    ARRAY['caregiver'],
    'caregiver',
    true
)
ON CONFLICT (id) DO UPDATE SET
    roles = ARRAY['caregiver'],
    active_role = 'caregiver',
    onboarding_caregiver_completed = true;
