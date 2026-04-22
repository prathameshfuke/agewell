# Database Schema

AgeWell uses **Supabase (PostgreSQL)** as its primary database. This document describes all tables, columns, and relationships.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles and metadata |
| `medications` | Medication records |
| `schedules` | Medication schedules |
| `adherence_logs` | Medication adherence tracking |
| `health_readings` | Vital signs and health data |
| `alerts` | System alerts and notifications |
| `prescriptions` | Prescription uploads and OCR data |
| `daily_check_ins` | Daily wellness check-ins |
| `voice_memos` | Voice memo recordings |
| `dispenser_devices` | Smart dispenser devices |
| `dispenser_slots` | Medication slots in devices |
| `diagnosis_sessions` | AI diagnosis session data |
| `audit_logs` | System audit trail |

---

## User Tables

### `profiles`
User profile information linked to Supabase Auth users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Links to auth.users.id |
| `full_name` | text | User's full name |
| `avatar_url` | text | Profile image URL |
| `phone` | text | Phone number for notifications |
| `role` | text | Primary role (elderly/caregiver) |
| `roles` | text[] | Array of all roles |
| `active_role` | text | Currently active role |
| `onboarding_completed` | boolean | General onboarding status |
| `onboarding_elder_completed` | boolean | Elder onboarding complete |
| `onboarding_caregiver_completed` | boolean | Caregiver onboarding complete |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### `elder_profiles`
Extended profile for elderly users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles.id |
| `medical_conditions` | jsonb | List of conditions |
| `mobility_level` | text | high/moderate/low |
| `temp_preference_min` | float | Min preferred temperature |
| `temp_preference_max` | float | Max preferred temperature |
| `humidity_preference_target` | float | Target humidity % |
| `wake_up_time` | text | HH:MM format |
| `bed_time` | text | HH:MM format |
| `updated_at` | timestamptz | Last update |

---

## Medication Tables

### `medications`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `name` | text | Medication name |
| `dosage` | text | Dosage amount |
| `frequency` | text | Frequency description |
| `type` | text | pill/liquid |
| `slot_number` | int | Dispenser slot (1-10) |
| `special_instructions` | text | Usage instructions |
| `active` | boolean | Is medication active |
| `created_at` | timestamptz | Creation date |

### `schedules`
Medication schedule times.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `medication_id` | bigint (FK) | Links to medications |
| `user_id` | uuid (FK) | Links to profiles |
| `time` | text | HH:MM format |
| `days_of_week` | int[] | Days [0-6], null = daily |
| `active` | boolean | Is schedule active |
| `created_at` | timestamptz | Creation date |

### `adherence_logs`
Tracks medication adherence.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `medication_id` | bigint (FK) | Links to medications |
| `schedule_id` | bigint (FK) | Links to schedules |
| `scheduled_date` | date | Date scheduled |
| `scheduled_time` | text | HH:MM scheduled |
| `taken_at` | timestamptz | When taken |
| `status` | text | pending/taken/missed/skipped |
| `notes` | text | Optional notes |

---

## Health Tables

### `health_readings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `spo2` | float | SpO₂ percentage |
| `heart_rate` | float | BPM |
| `temperature` | float | Celsius |
| `blood_pressure_systolic` | float | Systolic BP |
| `blood_pressure_diastolic` | float | Diastolic BP |
| `recorded_at` | timestamptz | Timestamp |
| `notes` | text | Optional notes |

### `daily_check_ins`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `check_in_date` | date | Date of check-in |
| `check_in_time` | timestamptz | Timestamp |
| `status` | text | pending/completed/missed |
| `mood` | text | User's mood |
| `notes` | text | Optional notes |

---

## Alert Tables

### `alerts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `alert_type` | text | health/medication/check_in |
| `severity` | text | low/medium/high/critical |
| `title` | text | Alert title |
| `message_elderly` | text | Message for elderly user |
| `message_caregiver` | text | Message for caregiver |
| `triggered_by` | jsonb | Context data |
| `status` | text | active/acknowledged/resolved |
| `read` | boolean | Is read |
| `created_at` | timestamptz | Creation time |
| `resolved_at` | timestamptz | Resolution time |

---

## Diagnosis Tables

### `diagnosis_sessions`
Stores AI diagnosis sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | UUID |
| `patient_id` | uuid (FK) | Links to profiles |
| `raw_complaint` | text | Initial symptom description |
| `extracted_symptoms` | jsonb | Array of symptoms |
| `qa_pairs` | jsonb | Q&A history |
| `image_observations` | text | Image analysis results |
| `image_flagged_urgent` | boolean | Image indicated urgency |
| `report_json` | jsonb | Generated report |
| `urgency_level` | text | GO_NOW/CONSULT_SOON/MONITOR/ROUTINE |
| `medication_flags` | jsonb | Medication interactions |
| `alert_sent` | boolean | Alert was sent |
| `acknowledged` | boolean | User acknowledged |
| `created_at` | timestamptz | Session start |
| `updated_at` | timestamptz | Last update |
| `exported_at` | timestamptz | PDF export time |

---

## Device Tables

### `dispenser_devices`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `device_name` | text | Device identifier |
| `device_type` | text | Device category |
| `pairing_code` | text | Pairing code |
| `is_active` | boolean | Device status |
| `created_at` | timestamptz | Creation date |

### `dispenser_slots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `device_id` | bigint (FK) | Links to dispenser_devices |
| `slot_number` | int | Slot 1-10 |
| `medication_id` | bigint (FK) | Links to medications |
| `current_count` | int | Pills remaining |
| `is_active` | boolean | Slot enabled |

### `smart_devices`
Home automation devices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `device_type` | text | ac/humidifier/light/lock |
| `device_name` | text | Device name |
| `room` | text | Room location |
| `is_active` | boolean | Device state |
| `current_setting` | text | Current value |
| `last_automation_trigger` | text | Last trigger reason |
| `updated_at` | timestamptz | Last update |

---

## Other Tables

### `prescriptions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `image_path` | text | Stored image path |
| `ocr_text` | text | Raw OCR output |
| `parsed_data` | jsonb | Structured data |
| `processing_status` | text | pending/processing/completed/failed |
| `uploaded_at` | timestamptz | Upload time |
| `processed_at` | timestamptz | Processing time |

### `voice_memos`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Links to profiles |
| `audio_url` | text | Audio file URL |
| `transcription` | text | Speech-to-text |
| `duration_seconds` | int | Recording length |
| `created_at` | timestamptz | Creation time |

### `audit_logs`

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | uuid (FK) | Optional user |
| `action` | text | Action performed |
| `entity_type` | text | Table/entity name |
| `entity_id` | bigint | Entity ID |
| `details` | jsonb | Additional data |
| `timestamp` | timestamptz | When occurred |

### `caregiver_elder_links`
Links caregivers to elders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `elder_user_id` | uuid (FK) | Elder profile |
| `caregiver_user_id` | uuid (FK) | Caregiver profile |
| `status` | text | pending/active/inactive |
| `permissions` | jsonb | Granted permissions |
| `created_at` | timestamptz | Creation time |
| `updated_at` | timestamptz | Last update |

### `pairing_codes`
Temporary pairing codes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Auto-increment |
| `code` | text | Pairing code |
| `elder_user_id` | uuid (FK) | Elder to link |
| `expires_at` | timestamptz | Expiration time |
| `used` | boolean | Is used |
| `created_at` | timestamptz | Creation time |

---

## Relationships

```
profiles ─────▶ elder_profiles
        ├─────▶ medications ─────▶ schedules
        ├─────▶ adherence_logs
        ├─────▶ health_readings
        ├─────▶ daily_check_ins
        ├─────▶ alerts
        ├─────▶ prescriptions
        ├─────▶ voice_memos
        ├─────▶ diagnosis_sessions
        ├─────▶ dispenser_devices ─▶ dispenser_slots
        ├─────▶ smart_devices
        └─────▶ caregiver_elder_links
```

## RLS Policies

Row Level Security (RLS) is enabled on all tables. Policies ensure:

- Users can only read/write their own data
- Caregivers can access linked elder data
- Admins can access all data

## Indexes

Primary indexes on all `id` columns. Foreign key indexes on:
- `user_id` columns
- `medication_id` in schedules and adherence_logs
- `patient_id` in diagnosis_sessions

## Migrations

All migrations are stored in `supabase/` directory. Run them in order for fresh setup.
