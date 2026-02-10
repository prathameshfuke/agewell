-- Add pairing_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pairing_code TEXT UNIQUE;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_pairing_code ON profiles(pairing_code);

-- Function to generate random pairing code (optional, can be done in frontend too, but DB is safer)
CREATE OR REPLACE FUNCTION generate_pairing_code() 
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6 char alphanumeric code (uppercase)
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE pairing_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
