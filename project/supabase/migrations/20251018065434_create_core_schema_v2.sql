/*
  # AGEWELL Platform - Core Database Schema
  
  ## Overview
  Complete foundational database for AGEWELL intelligent assistant platform.
  
  ## New Tables
  1. user_profiles - Extended user information
  2. health_profiles - Medical conditions and templates
  3. caregiver_relationships - Links caregivers to elderly users
  4. medications - Medication definitions and schedules
  5. medication_logs - Adherence tracking
  6. iot_devices - IoT device registry (medicine dispenser, sensors, actuators)
  7. sensor_readings - Time-series sensor data
  8. alerts - Alert history and notification queue
  9. automation_logs - Automated action tracking
  10. user_feedback - User feedback for AI learning
  
  ## Security
  - RLS enabled on all tables
  - Role-based access control for elderly/caregiver/doctor
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('elderly', 'caregiver', 'doctor')),
  display_name text NOT NULL,
  date_of_birth date,
  emergency_contact text,
  preferences jsonb DEFAULT '{"fontSize": "large", "voiceEnabled": true, "theme": "high-contrast"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Caregiver Relationships (created early to avoid circular dependencies)
CREATE TABLE IF NOT EXISTS caregiver_relationships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  elderly_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('family', 'professional', 'doctor')),
  permissions jsonb DEFAULT '{"viewHealth": true, "modifyMedications": true, "controlDevices": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(caregiver_id, elderly_id)
);

ALTER TABLE caregiver_relationships ENABLE ROW LEVEL SECURITY;

-- 3. Health Profiles
CREATE TABLE IF NOT EXISTS health_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conditions text[] DEFAULT '{}',
  baseline_vitals jsonb DEFAULT '{}'::jsonb,
  temperature_preference numeric DEFAULT 22.0,
  automation_rules jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Medications
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  schedule_times time[] DEFAULT '{}',
  pill_color text,
  pill_shape text,
  slot_number integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  instructions text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(active) WHERE active = true;

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

-- 5. Medication Logs
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id uuid NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  actual_time timestamptz,
  status text NOT NULL CHECK (status IN ('taken', 'missed', 'late', 'skipped')),
  dispensed_by_device boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status ON medication_logs(status);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- 6. IoT Devices
CREATE TABLE IF NOT EXISTS iot_devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  device_name text NOT NULL,
  mqtt_topic text NOT NULL,
  device_model text,
  location text,
  configuration jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iot_devices_user_id ON iot_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);

ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;

-- 7. Sensor Readings
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id uuid NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  sensor_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_id ON sensor_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON sensor_readings(sensor_type);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- 8. Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'resolved')),
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 9. Automation Logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id uuid REFERENCES iot_devices(id) ON DELETE SET NULL,
  action text NOT NULL,
  reason text NOT NULL,
  success boolean DEFAULT true,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_logs(timestamp DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- 10. User Feedback
CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  feedback_text text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at DESC);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for caregiver_relationships
CREATE POLICY "Users can view their relationships"
  ON caregiver_relationships FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid() OR elderly_id = auth.uid());

CREATE POLICY "Caregivers can insert relationships"
  ON caregiver_relationships FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Users can delete their relationships"
  ON caregiver_relationships FOR DELETE
  TO authenticated
  USING (caregiver_id = auth.uid() OR elderly_id = auth.uid());

-- RLS Policies for health_profiles
CREATE POLICY "Users can view accessible health profiles"
  ON health_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = health_profiles.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own health profile"
  ON health_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Caregivers can update assigned health profiles"
  ON health_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = health_profiles.user_id
      AND caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = health_profiles.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own health profile"
  ON health_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for medications
CREATE POLICY "Users can view accessible medications"
  ON medications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = medications.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can manage medications"
  ON medications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = medications.user_id
      AND caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = medications.user_id
      AND caregiver_id = auth.uid()
    )
  );

-- RLS Policies for medication_logs
CREATE POLICY "Users can view accessible medication logs"
  ON medication_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = medication_logs.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own medication logs"
  ON medication_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert any medication logs"
  ON medication_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for iot_devices
CREATE POLICY "Users can view accessible devices"
  ON iot_devices FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = iot_devices.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can manage devices"
  ON iot_devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = iot_devices.user_id
      AND caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = iot_devices.user_id
      AND caregiver_id = auth.uid()
    )
  );

-- RLS Policies for sensor_readings
CREATE POLICY "Users can view accessible sensor readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = sensor_readings.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for alerts
CREATE POLICY "Users can view accessible alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = alerts.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for automation_logs
CREATE POLICY "Users can view accessible automation logs"
  ON automation_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = automation_logs.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "System can insert automation logs"
  ON automation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_feedback
CREATE POLICY "Users can view accessible feedback"
  ON user_feedback FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM caregiver_relationships
      WHERE elderly_id = user_feedback.user_id
      AND caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at
  BEFORE UPDATE ON health_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();