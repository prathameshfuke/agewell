-- ASSIGN CAREGIVER ROLE (Run AFTER Signup)

DO $$ 
DECLARE
    target_email TEXT := 'admin@agewell.com';
    user_id UUID;
    _roles_column_exists BOOLEAN;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found. Please sign up first.', target_email;
    END IF;

    -- Check Schema Version
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'roles'
    ) INTO _roles_column_exists;

    -- Update Profile
    IF _roles_column_exists THEN
        UPDATE public.profiles
        SET roles = array_append(roles, 'caregiver'),
            active_role = 'caregiver',
            onboarding_caregiver_completed = true
        WHERE id = user_id;
    ELSE
        UPDATE public.profiles
        SET role = 'caregiver'
        WHERE id = user_id;
    END IF;

    RAISE NOTICE 'Caregiver role assigned to %', target_email;
END $$;
