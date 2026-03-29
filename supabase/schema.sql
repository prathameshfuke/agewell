-- AgeWell+ Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('elderly', 'caregiver')),  -- NULL means user needs to select role
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  linked_elderly_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DISPENSER DEVICES (ESP32)
-- ============================================
CREATE TABLE IF NOT EXISTS dispenser_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'My Dispenser',
  wifi_status TEXT DEFAULT 'offline' CHECK (wifi_status IN ('online', 'offline', 'connecting')),
  last_seen TIMESTAMPTZ,
  firmware_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEDICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  dosage_unit TEXT DEFAULT 'mg',
  form TEXT CHECK (form IN ('pill', 'tablet', 'capsule', 'liquid')) DEFAULT 'pill',
  frequency TEXT,
  schedule_times TEXT[] DEFAULT ARRAY['08:00'],
  special_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISPENSER SLOTS (3 per device)
-- ============================================
CREATE TABLE IF NOT EXISTS dispenser_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES dispenser_devices(id) ON DELETE CASCADE,
  slot_number INT CHECK (slot_number BETWEEN 1 AND 3) NOT NULL,
  medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
  current_quantity INT DEFAULT 0,
  max_quantity INT DEFAULT 30,
  led_color TEXT DEFAULT '#4CAF50',
  UNIQUE(device_id, slot_number)
);

-- Auto-create 3 slots when device is registered
CREATE OR REPLACE FUNCTION public.create_device_slots()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dispenser_slots (device_id, slot_number, led_color)
  VALUES 
    (NEW.id, 1, '#4CAF50'),
    (NEW.id, 2, '#2196F3'),
    (NEW.id, 3, '#FF9800');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_device_created ON dispenser_devices;
CREATE TRIGGER on_device_created
  AFTER INSERT ON dispenser_devices
  FOR EACH ROW EXECUTE FUNCTION public.create_device_slots();

-- ============================================
-- ADHERENCE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS adherence_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'taken', 'missed', 'skipped')) DEFAULT 'pending',
  dispensed_by TEXT CHECK (dispensed_by IN ('device', 'manual')) DEFAULT 'manual',
  verified_by_sensor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HEALTH READINGS (SpO2, Heart Rate, Temp)
-- ============================================
CREATE TABLE IF NOT EXISTS health_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES dispenser_devices(id) ON DELETE SET NULL,
  spo2 INT CHECK (spo2 BETWEEN 0 AND 100),
  heart_rate INT CHECK (heart_rate BETWEEN 0 AND 300),
  body_temperature DECIMAL(4,1),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENVIRONMENTAL READINGS
-- ============================================
CREATE TABLE IF NOT EXISTS environmental_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID REFERENCES dispenser_devices(id) ON DELETE CASCADE,
  ambient_temperature DECIMAL(4,1),
  humidity DECIMAL(4,1),
  gas_level INT,
  air_quality TEXT CHECK (air_quality IN ('good', 'moderate', 'hazardous')) DEFAULT 'good',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('medication', 'health', 'environmental', 'device', 'checkin')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  title TEXT NOT NULL,
  message TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOICE MEMOS
-- ============================================
CREATE TABLE IF NOT EXISTS voice_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  is_played BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WELLNESS CHECK-INS ("I'm OK" button)
-- ============================================
CREATE TABLE IF NOT EXISTS wellness_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mood TEXT CHECK (mood IN ('good', 'fine', 'unwell')) DEFAULT 'good',
  source TEXT CHECK (source IN ('app', 'device')) DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSISTIVE DIAGNOSIS SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS diagnosis_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_complaint TEXT NOT NULL,
  extracted_symptoms JSONB DEFAULT '[]',
  qa_pairs JSONB DEFAULT '[]',
  image_observations TEXT,
  report_json JSONB,
  urgency_level TEXT CHECK (urgency_level IN ('ROUTINE', 'CONSULT_SOON', 'GO_NOW')),
  medication_flags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

ALTER TABLE diagnosis_sessions ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE diagnosis_sessions ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE diagnosis_sessions ADD COLUMN IF NOT EXISTS image_flagged_urgent BOOLEAN DEFAULT FALSE;

-- ============================================
-- DIAGNOSIS ALERT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS diagnosis_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  channels_notified JSONB DEFAULT '[]',
  recipients JSONB DEFAULT '[]',
  alert_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- SYMPTOM AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS symptom_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES diagnosis_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispenser_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispenser_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS helper functions (avoid recursive policy evaluation on profiles)
CREATE OR REPLACE FUNCTION public.current_linked_elderly_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.linked_elderly_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_access_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_user_id = auth.uid()
      OR target_user_id = public.current_linked_elderly_id();
$$;

-- Profiles: Users can read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Caregivers can view linked elderly profile
DROP POLICY IF EXISTS "Caregivers can view linked elderly" ON profiles;
CREATE POLICY "Caregivers can view linked elderly" ON profiles FOR SELECT
  USING (id = public.current_linked_elderly_id());

-- Devices: Owner has full access
DROP POLICY IF EXISTS "Device owner has full access" ON dispenser_devices;
CREATE POLICY "Device owner has full access" ON dispenser_devices FOR ALL USING (user_id = auth.uid());

-- Medications: Owner has full access
DROP POLICY IF EXISTS "Medication owner has full access" ON medications;
CREATE POLICY "Medication owner has full access" ON medications FOR ALL USING (user_id = auth.uid());

-- Caregivers can manage linked elderly's medications
DROP POLICY IF EXISTS "Caregivers can manage linked medications" ON medications;
CREATE POLICY "Caregivers can manage linked medications" ON medications FOR ALL
  USING (user_id = public.current_linked_elderly_id());

-- Slots: Access through device ownership
DROP POLICY IF EXISTS "Slot access via device" ON dispenser_slots;
CREATE POLICY "Slot access via device" ON dispenser_slots FOR ALL
  USING (device_id IN (SELECT id FROM dispenser_devices WHERE user_id = auth.uid()));

-- Adherence: Access through medication ownership
DROP POLICY IF EXISTS "Adherence via medication" ON adherence_logs;
CREATE POLICY "Adherence via medication" ON adherence_logs FOR ALL
  USING (medication_id IN (SELECT id FROM medications WHERE public.can_access_user(user_id)));

-- Health readings: Owner + caregivers
DROP POLICY IF EXISTS "Health access" ON health_readings;
CREATE POLICY "Health access" ON health_readings FOR ALL
  USING (public.can_access_user(user_id));

-- Environmental: Via device
DROP POLICY IF EXISTS "Environmental via device" ON environmental_readings;
CREATE POLICY "Environmental via device" ON environmental_readings FOR ALL
  USING (device_id IN (SELECT id FROM dispenser_devices WHERE public.can_access_user(user_id)));

-- Alerts: Owner + caregivers
DROP POLICY IF EXISTS "Alert access" ON alerts;
CREATE POLICY "Alert access" ON alerts FOR ALL
  USING (public.can_access_user(user_id));

-- Voice memos: Sender and receiver
DROP POLICY IF EXISTS "Voice memo access" ON voice_memos;
CREATE POLICY "Voice memo access" ON voice_memos FOR ALL
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Wellness check-ins
DROP POLICY IF EXISTS "Checkin access" ON wellness_checkins;
CREATE POLICY "Checkin access" ON wellness_checkins FOR ALL
  USING (public.can_access_user(user_id));

-- Diagnosis sessions: patient + linked caregiver
DROP POLICY IF EXISTS "Diagnosis session access" ON diagnosis_sessions;
CREATE POLICY "Diagnosis session access" ON diagnosis_sessions FOR ALL
  USING (public.can_access_user(patient_id));

-- Diagnosis alerts: patient + linked caregiver
DROP POLICY IF EXISTS "Diagnosis alerts access" ON diagnosis_alerts;
CREATE POLICY "Diagnosis alerts access" ON diagnosis_alerts FOR SELECT
  USING (public.can_access_user(patient_id));

-- Symptom audit log: patient + linked caregiver
DROP POLICY IF EXISTS "Symptom audit access" ON symptom_audit_log;
CREATE POLICY "Symptom audit access" ON symptom_audit_log FOR SELECT
  USING (public.can_access_user(patient_id));

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'health_readings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE health_readings;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'adherence_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE adherence_logs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dispenser_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dispenser_devices;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wellness_checkins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wellness_checkins;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'diagnosis_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE diagnosis_sessions;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'diagnosis_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE diagnosis_alerts;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'symptom_audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE symptom_audit_log;
  END IF;
END $$;
