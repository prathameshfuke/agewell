# AgeWell Architecture

## System Overview

AgeWell follows a modular architecture with clear separation between the React frontend, Flask backend, and Supabase database services.

```
┌──────────────────────────┐
│      Client (Web)      │
│  React + Vite + Tailwind │
└──────────────────────────┘
           │
           ▼ REST API
┌─────────────────────────────────────────┐
│         Backend (Flask)            │
│  ┌──────────────────────────────┐ │
│  │ Routes (API Endpoints)         │ │
│  │  │ Health, Medication, AI, etc │ │
│  └──────────────────────────────┘ │
│  ┌──────────────────────────────┐ │
│  │ Services (Business Logic)      │ │
│  │  │ AI Assistant, Notifications │ │
│  └──────────────────────────────┘ │
└─────────────────────────────────────────┘
           │
           ▼ SQL / Real-time
┌─────────────────────────────────────────┐
│      Supabase (PostgreSQL)        │
│  Auth, Database, Real-time Subscriptions │
└─────────────────────────────────────────┘
```

## Core Modules

### 1. Authentication & User Management
- **Location:** `frontend/src/contexts/AuthContext.jsx`, `backend/routes/user_routes.py`
- **Features:** Google OAuth, multi-role support (elderly/caregiver), profile management
- **Flow:** OAuth → Profile creation → Role selection → Onboarding → Dashboard

### 2. Medication Management
- **Location:** `backend/routes/medication_routes.py`, `frontend/src/pages/ElderMeds.jsx`
- **Features:** Schedule creation, adherence logging, device slot assignment
- **Models:** Medication, AdherenceLog, Schedule

### 3. Health Monitoring
- **Location:** `backend/routes/health_routes.py`, `backend/services/ai_assistant.py`
- **Features:** Vitals tracking, threshold alerts, trend analysis
- **Health Thresholds:**
  - SpO₂: Critical <90%, Warning <93%, Normal ≥95%
  - Heart Rate: Critical <50 or >120, Normal 60-100
  - Temperature: Critical <35°C or >38.5°C, Normal 36.1-37.2°C

### 4. AI Diagnosis System
- **Location:** `backend/routes/diagnosis_routes.py`, `backend/services/groq_service.py`
- **Flow:** Symptom input → Q&A (max 8 questions) → Optional image analysis → Report generation
- **Urgency Levels:** GO_NOW, CONSULT_SOON, MONITOR, ROUTINE

### 5. Smart Device Automation
- **Location:** `backend/routes/automation_routes.py`, `backend/services/automation_service.py`
- **Features:** Temperature control, humidifier management, lighting automation
- **Triggers:** Time-based, health-based, manual override

### 6. Notification System
- **Location:** `backend/services/notification_service.py`
- **Channels:** WhatsApp (primary), Push notifications
- **Types:** Health alerts, medication reminders, missed check-ins, diagnosis reports

## Data Flow

### Typical User Journey

```
1. Authentication
   User → Google OAuth → Supabase Auth → Profile Creation

2. Onboarding
   Role Selection → Profile Setup → Device Pairing (optional)

3. Daily Usage
   Elder: Dashboard → Meds Taken (mark) → Health Check-in
   Caregiver: Family Dashboard → View Status → Receive Alerts

4. Diagnosis (when needed)
   Symptom Input → Q&A Flow → Report → Share with Caregiver
```

## Security Considerations

- **Authentication:** JWT tokens via Supabase Auth
- **Authorization:** Role-based access control (RBAC)
- **Data Privacy:** User data isolated by user_id
- **API Keys:** Stored in environment variables, never committed
- **CORS:** Configured for development (update for production)

## Scalability

- **Stateless Backend:** Flask app can be horizontally scaled
- **Database:** PostgreSQL with connection pooling
- **Static Assets:** Frontend can be served via CDN
- **Real-time:** Supabase handles WebSocket subscriptions
