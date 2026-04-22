# Backend Documentation

## Overview

The AgeWell backend is a Flask application providing REST APIs for the frontend. It handles:

- User and profile management
- Medication scheduling and adherence tracking
- Health data recording and analysis
- AI-powered diagnosis
- Smart device automation
- Notification delivery

## Tech Stack

- **Framework:** Flask 3.0
- **Database:** SQLAlchemy 3.1 with Supabase (PostgreSQL)
- **CORS:** Flask-CORS
- **AI Services:** Groq API, Google Gemini
- **OCR:** Tesseract 5.5.0 (via pytesseract)
- **PDF:** ReportLab
- **Notifications:** Twilio (WhatsApp)
- **Auth:** Supabase Auth (JWT validation)

## Project Structure

```
backend/
├── app.py                 # Application entry point
├── models.py              # SQLAlchemy models
├── database.py            # Database initialization
├── seed_data.py           # Sample data generator
├── requirements.txt       # Dependencies
├── .env                   # Environment variables
├── .env.example           # Environment template
├── routes/                # API route handlers
│   ├── __init__.py
│   ├── health_routes.py
│   ├── medication_routes.py
│   ├── user_routes.py
│   ├── prescription_routes.py
│   ├── ai_routes.py
│   ├── diagnosis_routes.py
│   ├── notification_routes.py
│   ├── automation_routes.py
│   ├── linking_routes.py
│   └── settings_routes.py
└── services/              # Business logic
    ├── __init__.py
    ├── ai_assistant.py
    ├── automation_service.py
    ├── notification_service.py
    ├── ocr_service.py
    ├── groq_service.py
    ├── gemini_service.py
    ├── pdf_service.py
    ├── emergency_alert_service.py
    ├── audit_service.py
    ├── settings_service.py
    └── session_store.py
```

## Application Factory

The app is initialized in `app.py`:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Configure for production

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://...'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)

# Register blueprints
from routes import health_routes, medication_routes, ...
app.register_blueprint(health_routes.bp)
...
```

## Services

### AI Assistant (`services/ai_assistant.py`)

Core health analysis engine.

**Methods:**

```python
# Analyze health readings for anomalies
analysis = ai_assistant.analyze_health_data(user_id, hours=24)

# Check medication adherence
adherence = ai_assistant.check_medication_adherence(user_id, days=7)

# Generate contextual alert
alert = ai_assistant.generate_alert(user_id, alert_type='health')

# Comprehensive analysis
report = ai_assistant.comprehensive_analysis(user_id)
```

**Health Thresholds:**

| Metric | Critical | Warning | Normal |
|--------|----------|---------|--------|
| SpO₂ | <90% | <93% | ≥95% |
| Heart Rate | <50 or >120 | <55 or >110 | 60-100 |
| Temperature | <35°C or >38.5°C | <35.5°C or >37.8°C | 36.1-37.2°C |
| BP Systolic | <90 or >160 | <100 or >140 | 110-130 |
| BP Diastolic | <60 or >100 | <65 or >90 | 70-85 |

### Diagnosis Service (`services/groq_service.py`)

LLM-powered symptom diagnosis.

**Methods:**

```python
# Extract symptoms and first question
result = extract_symptoms_and_first_question(
    raw_complaint="I've been having chest pain",
    api_key="groq_api_key"
)
# Returns: { extracted_symptoms: [...], next_question: "..." }

# Get next question
result = get_next_question(
    raw_complaint="...",
    qa_pairs=[{"question": "...", "answer": "yes"}],
    api_key="..."
)

# Generate final report
report = generate_diagnosis_report(
    raw_complaint="...",
    qa_pairs=[...],
    image_observations="...",
    medications=[...],
    api_key="..."
)
# Returns: { urgency_level, symptom_summary, differential_diagnosis, ... }
```

### Image Analysis (`services/gemini_service.py`)

Medical image analysis using Google Gemini.

```python
result = analyze_medical_image(image_bytes, api_key="...")
# Returns: { observations: "...", flagged_urgent: boolean }
```

### Notification Service (`services/notification_service.py`)

Multi-channel notification delivery.

**Methods:**

```python
service = NotificationService()

# Send alert
service.send_alert_notification(
    alert={
        'title': '...',
        'severity': 'high',
        'message_elderly': '...',
        'message_caregiver': '...'
    },
    user_phone="+1234567890",
    caregiver_phone="+0987654321"
)

# Medication reminder
service.send_medication_reminder(
    user_phone="...",
    medication_name="Metformin",
    time="08:00"
)

# Daily check-in reminder
service.send_check_in_reminder(
    user_phone="...",
    user_name="John"
)
```

### OCR Service (`services/ocr_service.py`)

Prescription text extraction.

```python
result = extract_text_from_image(image_path)
# Returns: { text: "...", confidence: 0.95 }

medications = parse_medications(ocr_text)
# Returns: [{ name, dosage, frequency, ... }]
```

### PDF Service (`services/pdf_service.py`)

Generate diagnosis PDF reports.

```python
pdf_bytes = generate_diagnosis_pdf(session, patient_name="John")
```

### Automation Service (`services/automation_service.py`)

Smart home device automation.

```python
# Get automations for user
automations = get_automations_for_user(user_id)

# Trigger automation
trigger_automation(user_id, device_id, action="set_temperature", value="24")
```

### Session Store (`services/session_store.py`)

In-memory store for diagnosis sessions.

```python
# Create session
session = session_store.create_session(
    patient_id="...",
    raw_complaint="...",
    extracted_symptoms=[...]
)

# Get session
session = session_store.get_session(session_id)

# Append Q&A
session = session_store.append_qa(session_id, question, answer)

# Get daily count
count = session_store.get_daily_count(patient_id)
```

## Routes

### Health Routes (`routes/health_routes.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/readings` | POST | Add health reading |
| `/api/health/readings/{id}` | GET | Get user's readings |
| `/api/health/stats/{id}` | GET | Get health statistics |

### Medication Routes (`routes/medication_routes.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/medications` | POST | Create medication |
| `/api/medications/{id}` | GET | Get medications |
| `/api/medications/{id}` | PUT | Update medication |
| `/api/medications/schedule/{id}` | GET | Get schedule |
| `/api/medications/adherence` | POST | Log adherence |

### User Routes (`routes/user_routes.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | POST | Create user |
| `/api/users/{id}` | GET | Get user |
| `/api/users/check-in` | POST | Daily check-in |
| `/api/users/link-caregiver` | POST | Link caregiver |

### Diagnosis Routes (`routes/diagnosis_routes.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/diagnosis/start` | POST | Start session |
| `/api/diagnosis/answer` | POST | Submit answer |
| `/api/diagnosis/upload-image` | POST | Upload image |
| `/api/diagnosis/generate-report` | POST | Generate report |
| `/api/diagnosis/export-pdf/{id}` | GET | Export PDF |
| `/api/diagnosis/history/{id}` | GET | Get history |

### AI Routes (`routes/ai_routes.py`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/analyze/{id}` | GET | Full analysis |
| `/api/ai/health-analysis/{id}` | GET | Health only |
| `/api/ai/medication-analysis/{id}` | GET | Medication only |
| `/api/ai/alerts/{id}` | GET | Get alerts |

## Database Models

See [DATABASE.md](DATABASE.md) for full schema.

Key relationships:
- User has_many Medications
- User has_many HealthReadings
- User has_many AdherenceLogs
- User has_many Alerts
- Medication has_many Schedules
- Medication has_many AdherenceLogs

## Environment Variables

Create `.env` from `.env.example`:

```
# Database (Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_KEY=eyJ...

# AI Services
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Tesseract OCR
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe

# Notifications
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Flask
FLASK_DEBUG=1
SECRET_KEY=your-secret-key
```

## Running Locally

```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run application
python app.py
# Server runs on http://localhost:5001
```

## Testing

```bash
# Run tests
python -m pytest

# Test specific module
python -m pytest tests/test_health.py
```

## Deployment

### Production Considerations

1. **Use WSGI Server:**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5001 app:app
   ```

2. **Database:** Use PostgreSQL connection pool

3. **Security:**
   - Set `FLASK_DEBUG=0`
   - Use strong `SECRET_KEY`
   - Enable HTTPS
   - Configure CORS properly

4. **Logging:**
   ```python
   import logging
   logging.basicConfig(level=logging.INFO)
   ```

## Error Handling

All routes follow consistent error handling:

```python
@bp.route('/example', methods=['POST'])
def example():
    try:
        data = request.get_json()
        # Process...
        return jsonify({'success': True, 'data': result})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500
```
