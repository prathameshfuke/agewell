# AGEWELL - Intelligent Elderly Care Platform

AGEWELL is a comprehensive AI-powered platform designed to support elderly wellness through seamless medication adherence management and intelligent home automation. The system integrates health monitoring, IoT device control via MQTT, and dual-mode interfaces optimized for both elderly users and caregivers.

## Features

### For Elderly Users

- **Ultra-Large Text Interface:** High-contrast, touch-friendly design with 3-4x standard text sizes
- **Medication Reminders:** Visual pill identification with color, shape, and slot information
- **One-Tap Actions:** Simple "I Took This" and "I'm OK" buttons with immediate feedback
- **Voice Support:** Text-to-speech for all critical information
- **Smart Medicine Dispenser:** Automated dispensing from WiFi-enabled pill box
- **Real-Time Health Monitoring:** SpO2, heart rate, temperature tracking
- **Environmental Control:** Temperature, air quality, lighting automation

### For Caregivers & Doctors

- **Multi-Patient Dashboard:** Manage multiple elderly dependents from one interface
- **Real-Time Alerts:** Critical, warning, and informational notifications
- **Medication Management:** Add, edit, and monitor medication schedules
- **Adherence Analytics:** 7-day, 30-day adherence rates and trends
- **Health Timeline:** Complete audit log of events and automated actions
- **Device Control:** Remote management of IoT devices
- **Export Reports:** Clinical documentation for doctor visits

### Health Profile Templates

Pre-configured automation for common conditions:

- **Arthritis:** Maintains room >26°C, gentle lighting, mobility reminders
- **COPD/Respiratory:** Air quality monitoring, purifier control, oxygen management
- **Claustrophobia:** Gradual lighting, auto-curtains, emergency ventilation
- **Heart Disease:** Continuous vital monitoring with smart thresholds
- **Sleep Apnea:** Bedroom environment optimization

### IoT & MQTT Integration

- **Medicine Dispenser Box:** Multi-slot automated pill dispensing
- **Health Sensors:** SpO2, heart rate, blood pressure, temperature
- **Environmental Sensors:** Temperature, humidity, CO2, air quality
- **Home Automation:** HVAC, lighting, fans, curtains, oxygen concentrators
- **Real-Time Communication:** WebSocket-based MQTT for instant device control

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS with custom high-contrast themes
- **Database:** Supabase (PostgreSQL with Row-Level Security)
- **Authentication:** Supabase Auth with role-based access control
- **Real-Time:** Supabase Realtime + MQTT over WebSocket
- **IoT Protocol:** MQTT (Message Queuing Telemetry Transport)
- **Icons:** Lucide React

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── AuthPage.tsx              # Login/signup interface
│   ├── elderly/
│   │   ├── ElderlyLayout.tsx         # Large-text navigation layout
│   │   ├── ElderlyHome.tsx           # Home dashboard for elderly
│   │   └── MedicationCard.tsx        # Medication reminder cards
│   └── caregiver/
│       ├── CaregiverDashboard.tsx    # Professional caregiver interface
│       ├── PatientCard.tsx           # Patient summary cards
│       └── AlertsList.tsx            # Alert management
├── contexts/
│   └── AuthContext.tsx               # Authentication state management
├── hooks/
│   └── useMedications.ts             # Medication data hooks
├── lib/
│   ├── supabase.ts                   # Supabase client singleton
│   └── database.types.ts             # TypeScript database types
├── services/
│   └── mqttService.ts                # MQTT client for IoT devices
├── App.tsx                            # Main application router
└── main.tsx                           # Application entry point
```

## Database Schema

### Core Tables

1. **user_profiles** - Extended user information (role, preferences, emergency contact)
2. **health_profiles** - Medical conditions, baselines, automation rules
3. **caregiver_relationships** - Links caregivers to elderly patients
4. **medications** - Medication definitions with schedule and slot mapping
5. **medication_logs** - Adherence tracking (taken/missed/late/skipped)
6. **iot_devices** - Device registry with MQTT topics
7. **sensor_readings** - Time-series health and environmental data
8. **alerts** - Multi-severity notification queue
9. **automation_logs** - Audit trail of automated actions
10. **user_feedback** - AI learning from user preferences

All tables have Row-Level Security (RLS) enabled with policies ensuring:
- Elderly users only access their own data
- Caregivers access assigned patients' data
- Doctors have read-only access to assigned patients

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd agewell
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup

The database schema is automatically applied through Supabase migrations. All tables, indexes, and RLS policies are created on first deployment.

### 4. MQTT Broker Setup

See [MQTT_SETUP.md](./MQTT_SETUP.md) for detailed instructions on:
- Setting up Mosquitto or cloud MQTT broker
- Configuring WebSocket support
- Registering IoT devices
- Arduino/ESP32 firmware examples

### 5. Run Development Server

```bash
npm run dev
```

Access at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm run preview
```

## User Roles

### Elderly (Patient)

- Simplified interface with large text and icons
- View medication reminders and confirm doses
- Check-in with "I'm OK" button
- View basic health stats and room conditions
- Cannot modify settings or view advanced data

### Caregiver

- Professional dashboard with multi-patient overview
- Add/edit medications and schedules
- Monitor adherence and health trends
- Acknowledge and resolve alerts
- Control IoT devices remotely
- View detailed analytics and audit logs

### Doctor

- Read-only access to assigned patients
- View medical history and adherence
- Export reports for clinical documentation
- Cannot modify medications (must request caregiver)

## Medicine Dispenser Integration

### Device Requirements

- WiFi-enabled microcontroller (ESP32/ESP8266)
- Multiple medication slots (7-28 recommended)
- Motor/actuator system for dispensing
- MQTT client library
- Optional: LED indicators, buzzer, LCD display

### MQTT Topics

```
agewell/{user_id}/dispenser/{device_id}/command    # Server → Device
agewell/{user_id}/dispenser/{device_id}/status     # Device → Server
agewell/{user_id}/dispenser/{device_id}/event      # Device → Server
```

### Command Examples

**Dispense from Slot 3:**
```json
{
  "action": "dispense",
  "slot": 3,
  "quantity": 1,
  "timestamp": "2025-10-18T10:30:00Z"
}
```

**Request Device Status:**
```json
{
  "action": "status"
}
```

See [MQTT_SETUP.md](./MQTT_SETUP.md) for complete API documentation and Arduino code examples.

## Sensor Integration

### Supported Sensors

- **Health:** SpO2, heart rate, blood pressure, temperature
- **Environmental:** Temperature, humidity, CO2, O2, air quality (PM2.5, VOC)
- **Activity:** Motion, fall detection, bed occupancy

### Data Format

All sensors publish to: `agewell/{user_id}/sensor/{sensor_type}`

```json
{
  "type": "spo2",
  "value": 95,
  "unit": "%",
  "timestamp": "2025-10-18T10:30:00Z",
  "metadata": {}
}
```

The platform automatically:
- Logs readings to database
- Checks against health baselines
- Creates alerts for abnormal values
- Triggers automated responses (e.g., increase ventilation if CO2 high)

## Alert System

### Severity Levels

- **Info:** Routine notifications (medication reminder)
- **Warning:** Attention needed (low medication stock)
- **Critical:** Urgent action required (missed medication, abnormal vitals)
- **Emergency:** Life-threatening (SpO2 < 85%, fall detected)

### Escalation Logic

1. **Info/Warning:** In-app notification + optional push
2. **Critical:** In-app + push + caregiver SMS/WhatsApp
3. **Emergency:** All channels + automatic retry + 911 if no response

## Adaptive Learning

The AI engine learns from:

- **User Feedback:** "Too cold", "Fan too loud", comfort adjustments
- **Adherence Patterns:** Optimal reminder timing
- **Environmental Preferences:** Temperature, lighting, airflow
- **Health Trends:** Baseline adjustments over time

Changes are proposed to caregivers for approval before automatic implementation.

## Security Features

- **Row-Level Security (RLS):** Database-level isolation between users
- **Role-Based Access Control:** Elderly, caregiver, doctor permissions
- **Encrypted Connections:** HTTPS for web, WSS for MQTT
- **Audit Logging:** Complete trail of all data access and modifications
- **HIPAA Compliance:** Ready for healthcare data handling
- **Session Management:** Automatic timeout for elderly users

## Testing

### Create Test Accounts

**Elderly User:**
- Role: Patient
- Email: elderly@test.com
- Password: test123

**Caregiver User:**
- Role: Caregiver
- Email: caregiver@test.com
- Password: test123

### Link Relationship

After creating both accounts, insert into `caregiver_relationships`:

```sql
INSERT INTO caregiver_relationships (caregiver_id, elderly_id, relationship_type)
VALUES (
  'caregiver-uuid',
  'elderly-uuid',
  'family'
);
```

## Deployment

### Supabase (Backend)

1. Create Supabase project
2. Migrations auto-apply on deployment
3. Configure authentication providers
4. Set up RLS policies (already in migration)

### Vercel/Netlify (Frontend)

```bash
npm run build
# Upload dist/ folder or connect Git repository
```

Set environment variables in deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### MQTT Broker

- Self-hosted: DigitalOcean Droplet with Mosquitto
- Cloud: AWS IoT Core, HiveMQ Cloud, Azure IoT Hub

See [MQTT_SETUP.md](./MQTT_SETUP.md) for production deployment checklist.

## Roadmap

### Phase 1 (Current)
- ✅ Core medication management
- ✅ Elderly and caregiver interfaces
- ✅ MQTT device integration
- ✅ Real-time alerts

### Phase 2
- [ ] OCR prescription scanning
- [ ] Video call integration
- [ ] Fall detection with wearables
- [ ] WhatsApp bot for caregivers

### Phase 3
- [ ] Predictive health analytics
- [ ] Multi-language support
- [ ] Voice assistant (Alexa/Google Home)
- [ ] Telemedicine integration

### Phase 4
- [ ] Insurance integration
- [ ] Pharmacy auto-refill
- [ ] AI health coach
- [ ] Community features

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For technical support or questions:
- Email: support@agewell.com
- Documentation: https://docs.agewell.com
- MQTT Setup: [MQTT_SETUP.md](./MQTT_SETUP.md)

## Acknowledgments

- Supabase for backend infrastructure
- Lucide React for beautiful icons
- TailwindCSS for styling
- Eclipse Mosquitto for MQTT broker
- Open-source community

---

**Built with care for elderly wellness** ❤️
