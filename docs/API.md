# API Reference

## Base URL

Development: `http://localhost:5001`

## Authentication

All endpoints require authentication via Supabase JWT token (handled by frontend). Session management is handled through Supabase Auth.

## Response Format

All responses are JSON with the following structure:

```json
{
  "success": true,
  "data": { },
  "message": "..."
}
```

Errors return:
```json
{
  "error": "Error message",
  "status": 400
}
```

---

## Health Endpoints

### `POST /api/health/readings`
Add a new health reading.

**Request Body:**
```json
{
  "user_id": 1,
  "spo2": 98,
  "heart_rate": 72,
  "temperature": 36.5,
  "blood_pressure_systolic": 120,
  "blood_pressure_diastolic": 80,
  "notes": "Optional notes"
}
```

### `GET /api/health/readings/{user_id}`
Get all health readings for a user.

**Response:**
```json
{
  "success": true,
  "readings": [
    {
      "id": 1,
      "spo2": 98,
      "heart_rate": 72,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### `GET /api/health/stats/{user_id}`
Get health statistics and trends.

---

## Medication Endpoints

### `POST /api/medications`
Create a new medication.

**Request Body:**
```json
{
  "user_id": 1,
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "twice daily",
  "type": "pill",
  "slot_number": 1,
  "schedule_times": ["08:00", "20:00"],
  "special_instructions": "Take with food"
}
```

### `GET /api/medications/{user_id}`
Get all medications for a user.

### `GET /api/medications/schedule/{user_id}`
Get today's medication schedule with adherence status.

### `POST /api/medications/adherence`
Log medication adherence.

**Request Body:**
```json
{
  "log_id": 1,
  "status": "taken",
  "notes": "Taken with breakfast"
}
```

---

## User Endpoints

### `POST /api/users`
Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "elderly"
}
```

### `GET /api/users/{user_id}`
Get user details.

### `POST /api/users/link-caregiver`
Link an elderly user to a caregiver.

**Request Body:**
```json
{
  "elderly_user_id": 1,
  "caregiver_user_id": 2
}
```

### `POST /api/users/check-in`
Daily wellness check-in.

**Request Body:**
```json
{
  "user_id": 1,
  "mood": "good",
  "notes": "Feeling well today"
}
```

---

## Prescription Endpoints

### `POST /api/prescriptions/upload`
Upload and process a prescription image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file), `user_id`

**Response:**
```json
{
  "success": true,
  "prescription_id": 1,
  "parsed_data": {
    "medications": [...]
  }
}
```

### `GET /api/prescriptions/{user_id}`
Get all prescriptions for a user.

---

## Diagnosis Endpoints

### `POST /api/diagnosis/start`
Start a new diagnosis session.

**Request Body:**
```json
{
  "patient_id": "uuid",
  "raw_complaint": "I've been having chest pain and shortness of breath"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "next_question": "Is the pain sharp or dull?",
  "extracted_symptoms": ["chest pain", "shortness of breath"],
  "progress": "1/8"
}
```

### `POST /api/diagnosis/answer`
Submit an answer to the current question.

**Request Body:**
```json
{
  "session_id": "uuid",
  "answer": "yes",
  "current_question": "Is the pain sharp or dull?"
}
```

### `POST /api/diagnosis/upload-image`
Upload an image for analysis.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `image` (file), `session_id`

### `POST /api/diagnosis/generate-report`
Generate the final diagnosis report.

**Request Body:**
```json
{
  "session_id": "uuid",
  "medications": ["Metformin", "Lisinopril"],
  "patient_name": "John Doe"
}
```

### `GET /api/diagnosis/history/{patient_id}`
Get diagnosis history for a patient.

### `GET /api/diagnosis/export-pdf/{session_id}`
Export diagnosis report as PDF.

### `POST /api/diagnosis/share`
Share diagnosis report with caregiver.

---

## Automation Endpoints

### `GET /api/automation/{user_id}`
Get user's smart devices and automation rules.

### `POST /api/automation/trigger`
Manually trigger a device automation.

**Request Body:**
```json
{
  "user_id": 1,
  "device_id": 1,
  "action": "set_temperature",
  "value": "24°C"
}
```

---

## Notification Endpoints

### `GET /api/notifications/{user_id}`
Get notifications for a user.

### `POST /api/notifications/{notification_id}/acknowledge`
Acknowledge a notification.

---

## Linking Endpoints

### `POST /api/linking/generate-code`
Generate a pairing code for elder-caregiver connection.

**Response:**
```json
{
  "success": true,
  "code": "A7B2C9",
  "expires_at": "2024-01-15T12:00:00Z"
}
```

### `POST /api/linking/verify`
Verify and complete pairing.

**Request Body:**
```json
{
  "code": "A7B2C9",
  "caregiver_user_id": "uuid"
}
```

### `POST /api/linking/unlink`
Unlink elder from caregiver.

---

## Settings Endpoints

### `GET /api/settings/{user_id}`
Get user settings.

### `POST /api/settings/{user_id}`
Update user settings.

**Request Body:**
```json
{
  "notification_preferences": {
    "whatsapp_enabled": true,
    "push_enabled": true
  },
  "groq_api_key": "...",
  "gemini_api_key": "..."
}
```

---

## AI Endpoints

### `GET /api/ai/analyze/{user_id}`
Comprehensive analysis of health and medication data.

### `GET /api/ai/health-analysis/{user_id}`
Health data analysis only.

### `GET /api/ai/medication-analysis/{user_id}`
Medication adherence analysis only.

### `GET /api/ai/alerts/{user_id}`
Get AI-generated alerts.

### `POST /api/ai/alerts/{alert_id}/resolve`
Resolve an alert.

---

## Health Check

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### `GET /`
API info.

**Response:**
```json
{
  "message": "AGEWELL API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "medications": "/api/medications",
    "ai": "/api/ai",
    "users": "/api/users"
  }
}
```
