# 🏥 AGEWELL - Elderly Care & Medication Management Platform

<div align="center">

![AGEWELL Logo](https://img.shields.io/badge/AGEWELL-Elderly%20Care-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-ready-success?style=for-the-badge)

**Empowering elderly independence through intelligent care management**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo)

</div>

---

## 🌟 Overview

AGEWELL is an intelligent, AI-powered platform designed to support elderly users and their caregivers in managing medications, monitoring health, and ensuring safety and independence.

### Key Highlights

- 🤖 **AI-Powered Health Analysis** - Real-time monitoring with intelligent alerts
- 💊 **Smart Medication Management** - Automated scheduling and adherence tracking
- 📸 **Prescription OCR** - Automatic medication extraction from images
- 👥 **Dual Interface** - Elderly-friendly UI + Detailed caregiver dashboard
- 📱 **Smart Notifications** - WhatsApp and push notifications
- 📊 **Analytics Dashboard** - Comprehensive health and adherence insights

---

## ✨ Features

### 🏥 Health Monitoring
- Real-time vital sign tracking (SpO₂, Heart Rate, Temperature, BP)
- Interactive health trend charts
- Automatic anomaly detection
- Threshold-based alerts (Critical/High/Medium/Low)
- Historical data analysis

### 💊 Medication Management
- Automated medication scheduling
- Device slot assignment (Pills: 1-7, Liquids: 8-10)
- Adherence tracking (Taken/Missed/Late)
- Medication reminders
- Adherence rate calculation

### 🤖 AI Assistant
- **Health Analysis:** Continuous monitoring, trend detection, severity assessment
- **Medication Analysis:** Adherence tracking, pattern recognition
- **Alert System:** Context-aware, role-specific messaging
- **Recommendations:** Personalized health and medication insights

### 📸 Prescription OCR
- Upload prescription images (PNG, JPG, PDF)
- Automatic text extraction (Tesseract OCR)
- Intelligent medication parsing
- Auto-schedule generation
- Device slot assignment

### 👤 User Management
- Elderly and caregiver accounts
- User linking (caregiver ↔ elderly)
- Daily "I'm OK" check-in
- Missed check-in alerts

### 🔔 Notifications
- WhatsApp integration (ready)
- Push notifications (ready)
- Critical alert escalation
- Medication reminders

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Tesseract OCR

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd AGEWELL
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python seed_data.py  # Load sample data
python app.py
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Windows Quick Start
Simply double-click `START_HERE.bat` and follow the menu!

---

## 📸 Screenshots

### Elderly Dashboard
Large, easy-to-read interface with simple navigation and friendly messaging.

### Caregiver Dashboard
Comprehensive analytics with real-time health metrics and AI-powered insights.

### Health Monitoring
Interactive charts showing vital sign trends over time.

### Medication Schedule
Clear medication schedule with adherence tracking.

---

## 🏗️ Architecture

### Backend (Flask)
```
backend/
├── app.py                 # Main application
├── models.py              # Database models
├── routes/                # API endpoints
│   ├── health_routes.py
│   ├── medication_routes.py
│   ├── ai_routes.py
│   ├── user_routes.py
│   └── prescription_routes.py
└── services/              # Business logic
    ├── ai_assistant.py
    ├── ocr_service.py
    └── notification_service.py
```

### Frontend (React)
```
frontend/src/
├── App.jsx
├── api/api.js             # API client
└── pages/
    ├── ElderlyDashboard.jsx
    ├── CaregiverDashboard.jsx
    ├── HealthMonitoring.jsx
    ├── MedicationSchedule.jsx
    ├── PrescriptionUpload.jsx
    └── AlertsPage.jsx
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Flask 3.0
- **Database:** SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- **OCR:** Tesseract
- **Image Processing:** Pillow

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v6

---

## 📊 API Endpoints

### Health
- `POST /api/health/readings` - Add health reading
- `GET /api/health/readings/<user_id>` - Get readings
- `GET /api/health/stats/<user_id>` - Get statistics

### Medications
- `POST /api/medications/` - Add medication
- `GET /api/medications/<user_id>` - Get medications
- `GET /api/medications/schedule/<user_id>` - Get schedule
- `POST /api/medications/adherence` - Log adherence

### AI
- `GET /api/ai/analyze/<user_id>` - Comprehensive analysis
- `GET /api/ai/alerts/<user_id>` - Get alerts
- `POST /api/ai/alerts/<id>/resolve` - Resolve alert

[Full API Documentation](API_TESTING.md)

---

## 🧠 AI Assistant Logic

### Health Thresholds
| Metric | Critical | Warning | Normal |
|--------|----------|---------|--------|
| SpO₂ | <90% | <93% | ≥95% |
| Heart Rate | <50 or >120 | <55 or >110 | 60-100 bpm |
| Temperature | <35°C or >38.5°C | <35.5°C or >37.8°C | 36.1-37.2°C |

### Alert Severity
- **Critical:** Immediate attention required
- **High:** Prompt action needed
- **Medium:** Monitor closely
- **Low:** Informational

### Adherence Scoring
- **Good:** ≥90% adherence
- **Needs Attention:** 70-89%
- **Poor:** <70%

---

## 📚 Documentation

- **[INDEX.md](INDEX.md)** - Documentation index
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
- **[FEATURES.md](FEATURES.md)** - Full feature list (150+ features)
- **[API_TESTING.md](API_TESTING.md)** - API testing guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🎯 Use Cases

### Daily Elderly User Flow
1. Complete "I'm OK" check-in
2. View upcoming medications
3. Mark medications as "Taken"
4. Add health readings
5. Review alerts

### Daily Caregiver Flow
1. Review dashboard status
2. Check active alerts
3. Monitor adherence rates
4. Review health trends
5. Act on AI recommendations

### Prescription Upload
1. Upload prescription image
2. AI extracts medication details
3. Medications auto-added to schedule
4. Notifications sent

---

## 🔒 Security

- Input validation on all endpoints
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration
- Environment variable management
- Audit logging
- Secure file upload handling

---

## 🚀 Deployment

### Production Checklist
- [ ] Implement JWT authentication
- [ ] Switch to PostgreSQL
- [ ] Configure HTTPS
- [ ] Set up WhatsApp API
- [ ] Configure push notifications
- [ ] Enable monitoring
- [ ] Security audit
- [ ] Performance optimization

[Full deployment guide in README.md](README.md#deployment)

---

## 📈 Project Stats

- **Total Features:** 150+
- **API Endpoints:** 25+
- **Database Tables:** 8
- **Lines of Code:** 10,000+
- **Documentation Pages:** 7
- **UI Pages:** 6

---

## 🤝 Contributing

This is a demonstration project. For production use:
1. Implement proper authentication
2. Add comprehensive testing
3. Enhance error handling
4. Add logging and monitoring
5. Implement data backup strategies

---

## 📝 License

This project is created for demonstration purposes.

---

## 🙏 Acknowledgments

Built with modern best practices:
- RESTful API design
- Component-based architecture
- Separation of concerns
- Responsive design
- Accessibility considerations

---

## 📞 Support

- **Documentation:** See [INDEX.md](INDEX.md) for all docs
- **Issues:** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Setup Help:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

<div align="center">

**AGEWELL** - Empowering elderly independence with intelligent care management

Made with ❤️ for better elderly care

[⬆ Back to Top](#-agewell---elderly-care--medication-management-platform)

</div>
