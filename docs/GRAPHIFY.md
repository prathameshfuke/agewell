# AgeWell - Visual Architecture & Data Flows

> Graphified documentation of the AgeWell elderly care platform.

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["📱 Client Layer"]
        Web[React 18 + Vite<br/>TailwindCSS + Framer Motion]
    end

    subgraph API["🌐 REST API Layer"]
        Flask[Flask Backend]

        subgraph Routes["Routes"]
            R1[auth_routes]
            R2[medication_routes]
            R3[health_routes]
            R4[diagnosis_routes]
            R5[automation_routes]
            R6[linking_routes]
        end

        subgraph Services["Services"]
            S1[AI Assistant<br/>Groq API]
            S2[Image Analysis<br/>Google Gemini]
            S3[OCR Processing<br/>Tesseract]
            S4[Notifications<br/>WhatsApp/SMS]
        end
    end

    subgraph Data["💾 Data Layer"]
        Supabase[(Supabase<br/>PostgreSQL)]
        Auth[Supabase Auth]
        Realtime[Real-time<br/>Subscriptions]
    end

    subgraph External["🔌 External Services"]
        Groq[Groq API]
        Gemini[Google Gemini]
        Twilio[Twilio<br/>WhatsApp/SMS]
        Google[Google OAuth]
    end

    Web <-->|REST API| Flask
    Flask --> Routes
    Routes --> Services
    Flask --> Supabase
    Flask --> Auth
    Auth --> Google
    S1 --> Groq
    S2 --> Gemini
    S4 --> Twilio
    Supabase --> Realtime
    Realtime --> Web
```

---

## 2. Database Entity Relationship

```mermaid
erDiagram
    profiles ||--o{ medications : "has"
    profiles ||--o{ schedules : "has"
    profiles ||--o{ adherence_logs : "tracks"
    profiles ||--o{ health_readings : "records"
    profiles ||--o{ alerts : "receives"
    profiles ||--o{ prescriptions : "uploads"
    profiles ||--o{ daily_check_ins : "completes"
    profiles ||--o{ voice_memos : "creates"
    profiles ||--o{ diagnosis_sessions : "initiates"
    profiles ||--o{ dispenser_devices : "owns"
    profiles ||--o{ smart_devices : "controls"
    profiles ||--o{ caregiver_elder_links : "links"
    profiles ||--|| elder_profiles : "extends"

    medications ||--o{ schedules : "scheduled"
    medications ||--o{ adherence_logs : "tracked"
    medications ||--o{ dispenser_slots : "stored"
    dispenser_devices ||--o{ dispenser_slots : "contains"

    profiles {
        uuid id PK
        text full_name
        text avatar_url
        text phone
        text role
        text[] roles
        text active_role
        boolean onboarding_completed
        timestamptz created_at
    }

    elder_profiles {
        bigint id PK
        uuid user_id FK
        jsonb medical_conditions
        text mobility_level
        float temp_preference_min
        float temp_preference_max
        text wake_up_time
        text bed_time
    }

    medications {
        bigint id PK
        uuid user_id FK
        text name
        text dosage
        text frequency
        text type
        int slot_number
        boolean active
    }

    schedules {
        bigint id PK
        bigint medication_id FK
        uuid user_id FK
        text time
        int[] days_of_week
        boolean active
    }

    adherence_logs {
        bigint id PK
        uuid user_id FK
        bigint medication_id FK
        bigint schedule_id FK
        date scheduled_date
        text scheduled_time
        timestamptz taken_at
        text status
    }

    health_readings {
        bigint id PK
        uuid user_id FK
        float spo2
        float heart_rate
        float temperature
        float blood_pressure_systolic
        float blood_pressure_diastolic
        timestamptz recorded_at
    }

    alerts {
        bigint id PK
        uuid user_id FK
        text alert_type
        text severity
        text title
        text message_elderly
        text message_caregiver
        text status
        timestamptz created_at
    }

    diagnosis_sessions {
        uuid id PK
        uuid patient_id FK
        text raw_complaint
        jsonb extracted_symptoms
        jsonb qa_pairs
        text urgency_level
        timestamptz created_at
    }

    caregiver_elder_links {
        bigint id PK
        uuid elder_user_id FK
        uuid caregiver_user_id FK
        text status
        jsonb permissions
    }
```

---

## 3. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as React App
    participant Auth as Supabase Auth
    participant Google as Google OAuth
    participant API as Flask Backend
    participant DB as PostgreSQL

    User->>Web: Click Login
    Web->>Auth: Request OAuth
    Auth->>Google: Redirect to OAuth
    User->>Google: Authorize
    Google->>Auth: Return tokens
    Auth->>Web: Session + User

    alt New User
        Web->>API: POST /create-profile
        API->>DB: Insert profiles
        DB-->>API: Profile created
        Web->>Web: Redirect to /role-select
        User->>Web: Select Role (elderly/caregiver)
        Web->>API: Update role
        API->>DB: Update profiles
        Web->>Web: Redirect to Onboarding
    else Existing User
        Web->>Web: Redirect to Dashboard
    end
```

---

## 4. AI Diagnosis Flow

```mermaid
sequenceDiagram
    actor Elder
    participant UI as Diagnosis UI
    participant API as Flask API
    participant Groq as Groq LLM
    participant Gemini as Google Gemini
    participant DB as Supabase
    participant Notif as Notification Service

    Elder->>UI: Describe Symptoms
    UI->>API: POST /diagnose/start
    API->>Groq: Extract symptoms
    Groq-->>API: Structured symptoms
    API->>DB: Create diagnosis_sessions

    loop Q&A (max 8 questions)
        API->>Groq: Generate question
        Groq-->>API: Question
        API-->>UI: Display question
        Elder->>UI: Answer
        UI->>API: Submit answer
        API->>Groq: Update context
    end

    opt Image Upload
        Elder->>UI: Upload photo
        UI->>Gemini: Analyze image
        Gemini-->>UI: Observations
        UI->>API: Image results
    end

    API->>Groq: Generate final report
    Groq-->>API: Report + Urgency
    API->>DB: Update session

    alt Urgent (GO_NOW)
        API->>Notif: Send urgent alert
        Notif->>Elder: WhatsApp/SMS
        Notif->>Caregiver: Alert notification
    else Non-urgent
        API->>Notif: Standard notification
    end

    API-->>UI: Complete report
    Elder->>UI: View/Download PDF
```

---

## 5. Medication Adherence Flow

```mermaid
flowchart TB
    subgraph Schedule["Schedule Creation"]
        A[Elder/Caregiver<br/>Add Medication] --> B[Set Dosage &<br/>Frequency]
        B --> C[Assign to<br/>Dispenser Slot]
        C --> D[Schedule Times<br/>& Days]
    end

    subgraph Daily["Daily Execution"]
        E[Scheduled Time<br/>Triggers] --> F{Notification<br/>Sent}
        F -->|WhatsApp/SMS| G[Elder Notified]
        F -->|Push| H[App Notification]
    end

    subgraph Action["Elder Response"]
        G --> I{Take Action}
        H --> I
        I -->|Taken| J[Mark Taken]
        I -->|Missed| K[Mark Missed]
        I -->|Skipped| L[Mark Skipped]
    end

    subgraph Tracking["Adherence Tracking"]
        J --> M[Update<br/>adherence_logs]
        K --> M
        L --> M
        M --> N[Dispense from<br/>Slot]
        N --> O[Update Slot<br/>Count]
    end

    subgraph Alert["Caregiver Alert"]
        K -->|After threshold| P[Send Alert<br/>to Caregiver]
        P --> Q[Caregiver Dashboard<br/>Updated]
    end

    D --> E
    O --> E
```

---

## 6. Health Monitoring Data Flow

```mermaid
graph LR
    subgraph Input["📥 Data Input"]
        Wearable[Smart Wearable<br/>SpO₂/HR Sensor]
        Manual[Manual Entry<br/>Elder/Caregiver]
        Integration[Device Integration<br/>API]
    end

    subgraph Processing["⚙️ Processing"]
        API[Flask Backend]
        AI[AI Analysis<br/>groq_service.py]
    end

    subgraph Storage["💾 Storage"]
        DB[(health_readings<br/>Table)]
    end

    subgraph Thresholds["📊 Threshold Analysis"]
        SpO2{SpO₂ < 90%?}
        HR{HR < 50 or > 120?}
        Temp{Temp < 35 or > 38.5?}
    end

    subgraph Actions["🚨 Actions"]
        Normal[Log Normal Reading]
        Warning[Create Warning Alert]
        Critical[Create Critical Alert<br/>Notify Caregiver]
    end

    subgraph Dashboard["📱 Dashboard"]
        ElderDash[Elder View<br/>Current Status]
        CaregiverDash[Caregiver View<br/>Trends & History]
    end

    Wearable --> API
    Manual --> API
    Integration --> API
    API --> DB
    API --> AI
    AI --> SpO2
    AI --> HR
    AI --> Temp

    SpO2 -->|No| Normal
    SpO2 -->|Yes| Critical
    HR -->|No| Normal
    HR -->|Yes| Critical
    Temp -->|No| Normal
    Temp -->|Yes| Warning

    Normal --> DB
    Warning --> DB
    Critical --> DB
    DB --> ElderDash
    DB --> CaregiverDash
```

---

## 7. Caregiver-Elder Linking Flow

```mermaid
stateDiagram-v2
    [*] --> Onboarding: Caregiver signs up

    Onboarding --> Dashboard: Complete profile

    Dashboard --> GenerateCode: Click "Add Elder"
    GenerateCode --> CodeGenerated: 6-digit code created
    CodeGenerated --> ElderEntersCode: Share code with elder

    ElderEntersCode --> ValidateCode: Elder enters code
    ValidateCode --> Pending: Code valid
    ValidateCode --> CodeGenerated: Code invalid/retry

    Pending --> Active: Caregiver confirms
    Pending --> Cancelled: Timeout/declined

    Active --> Dashboard: Link established
    Active --> ViewData: Caregiver can view:

    ViewData --> Medications: Medication schedule
    ViewData --> HealthReadings: Vitals history
    ViewData --> Alerts: Alert history
    ViewData --> DailyStatus: Daily check-ins

    Cancelled --> GenerateCode: Retry
    Cancelled --> [*]: Abandon

    Active --> RemoveLink: Unlink
    RemoveLink --> Dashboard: Elder removed
```

---

## 8. Component Hierarchy (Frontend)

```mermaid
graph TD
    App[App.jsx] --> Router[React Router]

    Router --> AuthRoute[AuthRoute<br/>Protected]
    Router --> Public[Public Routes]

    Public --> Login[Login.jsx]
    Public --> RoleSelect[RoleSelect.jsx]

    AuthRoute --> Layout[DashboardLayout]

    Layout --> ElderRoutes{Role: Elderly}
    Layout --> CaregiverRoutes{Role: Caregiver}

    ElderRoutes --> Home[Home.jsx<br/>Elder Dashboard]
    ElderRoutes --> Meds[ElderMeds.jsx]
    ElderRoutes --> Health[HealthCheckIn.jsx]
    ElderRoutes --> Diagnosis[QAFlow.jsx]
    ElderRoutes --> Report[DiagnosisReport.jsx]

    CaregiverRoutes --> Family[FamilyDashboard.jsx]
    CaregiverRoutes --> DayReplay[DayReplay.jsx]
    CaregiverRoutes --> LinkedElders[LinkedElders.jsx]

    Home --> MedCard[MedicationCard]
    Home --> HealthCard[HealthStatusCard]
    Home --> AlertCard[AlertCard]

    Meds --> ScheduleView[ScheduleView]
    Meds --> AdherenceLog[AdherenceLog]

    Family --> ElderCard[ElderStatusCard]
    Family --> HealthChart[HealthChart]

    subgraph Contexts["React Contexts"]
        AuthContext[AuthContext<br/>User/Session]
        ElderContext[ElderContext<br/>Elder State]
        HealthContext[HealthContext<br/>Vitals Data]
    end

    App --> Contexts
```

---

## 9. API Endpoint Map

```mermaid
mindmap
  root((API
  Endpoints))
    Authentication
      POST /auth/callback
      POST /create-profile
      GET /profile
      PUT /profile
    Medications
      GET /medications
      POST /medications
      PUT /medications/:id
      DELETE /medications/:id
      GET /schedules
      POST /adherence/log
    Health
      GET /health/readings
      POST /health/readings
      GET /health/summary
      POST /daily-checkin
    Diagnosis
      POST /diagnose/start
      POST /diagnose/answer
      POST /diagnose/analyze-image
      GET /diagnose/report/:id
      GET /diagnose/history
    Automation
      GET /smart-devices
      POST /smart-devices/:id/control
      GET /automation/rules
      POST /automation/trigger
    Linking
      POST /linking/generate-code
      POST /linking/validate-code
      GET /linking/elders
      DELETE /linking/:id
    Alerts
      GET /alerts
      POST /alerts/:id/acknowledge
      PUT /alerts/:id/resolve
    Prescriptions
      POST /prescriptions/upload
      GET /prescriptions/:id
      GET /prescriptions/:id/status
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph DNS["🌐 DNS / CDN"]
        Domain[agewell.app]
        CDN[Cloudflare CDN<br/>Static Assets]
    end

    subgraph Frontend["📱 Frontend Deployment"]
        Vercel[Vercel
        React Build]
    end

    subgraph Backend["⚙️ Backend Deployment"]
        Docker[Docker Container
        Flask App]
        Gunicorn[Gunicorn
        WSGI Server]
    end

    subgraph Database["💾 Database"]
        Supabase[(Supabase Cloud
        PostgreSQL)]
    end

    subgraph Monitoring["📊 Monitoring"]
        Logs[Vercel Logs]
        Health[Health Check
        /health]
    end

    Domain --> CDN
    CDN --> Vercel

    Vercel -->|API Calls| Docker
    Docker --> Gunicorn
    Gunicorn -->|SQL| Supabase

    Gunicorn --> Health
    Docker --> Logs
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `||--o{` | One-to-Many relationship |
| `||--||` | One-to-One relationship |
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `->>` | Async/HTTP Call |
| `-->>` | Response |
| `-->` | Sync Call/Flow |

---

> Generated with ❤️ for AgeWell documentation
