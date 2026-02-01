# AGEWELL API Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Health Endpoints

### 1. Add Health Reading
```bash
curl -X POST http://localhost:5000/api/health/readings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "spo2": 96.5,
    "heart_rate": 75,
    "temperature": 36.8,
    "blood_pressure_systolic": 120,
    "blood_pressure_diastolic": 80,
    "notes": "Feeling good today"
  }'
```

### 2. Get Health Readings
```bash
# Last 24 hours
curl http://localhost:5000/api/health/readings/1?hours=24

# Last 7 days
curl http://localhost:5000/api/health/readings/1?days=7

# Latest 10 readings
curl http://localhost:5000/api/health/readings/1?limit=10
```

### 3. Get Health Statistics
```bash
curl http://localhost:5000/api/health/stats/1?days=7
```

## Medication Endpoints

### 1. Add Medication
```bash
curl -X POST http://localhost:5000/api/medications/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "name": "Aspirin",
    "dosage": "75mg",
    "frequency": "once daily",
    "type": "pill",
    "slot_number": 1,
    "schedule_times": ["08:00"],
    "special_instructions": "Take with food",
    "start_date": "2024-01-01"
  }'
```

### 2. Get Medications
```bash
# Active medications only
curl http://localhost:5000/api/medications/1

# All medications
curl http://localhost:5000/api/medications/1?active_only=false
```

### 3. Get Medication Schedule
```bash
# Today's schedule
curl http://localhost:5000/api/medications/schedule/1

# Specific date
curl http://localhost:5000/api/medications/schedule/1?date=2024-01-15
```

### 4. Log Medication Adherence
```bash
curl -X POST http://localhost:5000/api/medications/adherence \
  -H "Content-Type: application/json" \
  -d '{
    "log_id": 1,
    "status": "taken",
    "notes": "Taken on time"
  }'
```

### 5. Get Adherence Logs
```bash
curl http://localhost:5000/api/medications/adherence/1?days=7
```

## User Endpoints

### 1. Create User
```bash
# Elderly user
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 75,
    "phone": "1234567890",
    "role": "elderly"
  }'

# Caregiver user
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mary Johnson",
    "age": 45,
    "phone": "0987654321",
    "role": "caregiver"
  }'
```

### 2. Get User
```bash
curl http://localhost:5000/api/users/1
```

### 3. Link Caregiver
```bash
curl -X POST http://localhost:5000/api/users/link-caregiver \
  -H "Content-Type: application/json" \
  -d '{
    "elderly_user_id": 1,
    "caregiver_user_id": 2
  }'
```

### 4. Daily Check-in
```bash
curl -X POST http://localhost:5000/api/users/check-in \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "mood": "good",
    "notes": "Feeling great today!"
  }'
```

### 5. Get Check-in Status
```bash
curl http://localhost:5000/api/users/check-in/status/1
```

## AI Endpoints

### 1. Comprehensive Analysis
```bash
curl http://localhost:5000/api/ai/analyze/1
```

### 2. Health Analysis
```bash
# Last 24 hours
curl http://localhost:5000/api/ai/health-analysis/1?hours=24

# Last 48 hours
curl http://localhost:5000/api/ai/health-analysis/1?hours=48
```

### 3. Medication Analysis
```bash
# Last 7 days
curl http://localhost:5000/api/ai/medication-analysis/1?days=7

# Last 30 days
curl http://localhost:5000/api/ai/medication-analysis/1?days=30
```

### 4. Get Alerts
```bash
# Active alerts
curl http://localhost:5000/api/ai/alerts/1?status=active

# All alerts
curl http://localhost:5000/api/ai/alerts/1?status=all
```

### 5. Acknowledge Alert
```bash
curl -X POST http://localhost:5000/api/ai/alerts/1/acknowledge
```

### 6. Resolve Alert
```bash
curl -X POST http://localhost:5000/api/ai/alerts/1/resolve
```

### 7. Get Recommendations
```bash
curl http://localhost:5000/api/ai/recommendations/1
```

## Prescription Endpoints

### 1. Upload Prescription
```bash
curl -X POST http://localhost:5000/api/prescriptions/upload \
  -F "file=@prescription.jpg" \
  -F "user_id=1"
```

### 2. Get Prescriptions
```bash
curl http://localhost:5000/api/prescriptions/1
```

### 3. Get Prescription Details
```bash
curl http://localhost:5000/api/prescriptions/detail/1
```

### 4. Reprocess Prescription
```bash
curl -X POST http://localhost:5000/api/prescriptions/reprocess/1
```

## Testing Workflow

### 1. Setup Test Environment
```bash
# Seed database with test data
cd D:\AGEWELL\backend
python seed_data.py
```

### 2. Test Health Monitoring Flow
```bash
# Add reading
curl -X POST http://localhost:5000/api/health/readings \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "spo2": 88, "heart_rate": 125, "temperature": 38.5}'

# Check AI analysis (should generate alerts)
curl http://localhost:5000/api/ai/health-analysis/1

# View alerts
curl http://localhost:5000/api/ai/alerts/1
```

### 3. Test Medication Flow
```bash
# Get today's schedule
curl http://localhost:5000/api/medications/schedule/1

# Mark medication as taken
curl -X POST http://localhost:5000/api/medications/adherence \
  -H "Content-Type: application/json" \
  -d '{"log_id": 1, "status": "taken"}'

# Check adherence
curl http://localhost:5000/api/ai/medication-analysis/1
```

### 4. Test Alert System
```bash
# Add critical health reading
curl -X POST http://localhost:5000/api/health/readings \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "spo2": 85, "heart_rate": 130}'

# Trigger analysis
curl http://localhost:5000/api/ai/analyze/1

# Check alerts
curl http://localhost:5000/api/ai/alerts/1
```

## Response Examples

### Successful Health Reading
```json
{
  "success": true,
  "reading": {
    "id": 1,
    "user_id": 1,
    "spo2": 96.5,
    "heart_rate": 75,
    "temperature": 36.8,
    "timestamp": "2024-01-15T10:30:00",
    "notes": "Feeling good today"
  }
}
```

### AI Analysis Response
```json
{
  "success": true,
  "analysis": {
    "user_id": 1,
    "timestamp": "2024-01-15T10:30:00",
    "health": {
      "status": "attention_needed",
      "severity": "high",
      "readings_count": 15,
      "metrics": {
        "spo2": {
          "current": 88,
          "average": 94.5,
          "trend": "decreasing",
          "alerts": [
            {
              "level": "critical",
              "message": "SpO₂ critically low at 88%"
            }
          ]
        }
      }
    },
    "medication_adherence": {
      "status": "good",
      "adherence_rate": 92.5,
      "total_doses": 40,
      "taken": 37,
      "missed": 2,
      "late": 1
    },
    "recommendations": [
      "Monitor health readings more frequently",
      "Ensure user is resting comfortably"
    ]
  }
}
```

### Alert Response
```json
{
  "success": true,
  "alerts": [
    {
      "id": 1,
      "user_id": 1,
      "alert_type": "health",
      "severity": "critical",
      "title": "Urgent Health Alert",
      "message_elderly": "We noticed some concerning health readings...",
      "message_caregiver": "URGENT: SpO₂ critically low at 88%...",
      "status": "active",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

## Testing Tips

1. **Use Postman**: Import these curl commands into Postman for easier testing
2. **Check Logs**: Monitor backend console for detailed error messages
3. **Database State**: Use `seed_data.py` to reset to known state
4. **Sequential Testing**: Test in order: Users → Health → Medications → AI
5. **Edge Cases**: Test with extreme values to trigger alerts

## Automated Testing Script

Save as `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "Testing AGEWELL API..."

# Test health check
echo "1. Health check..."
curl -s $BASE_URL/../health | jq

# Test user creation
echo "2. Creating user..."
curl -s -X POST $BASE_URL/users/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","phone":"1111111111","role":"elderly"}' | jq

# Test health reading
echo "3. Adding health reading..."
curl -s -X POST $BASE_URL/health/readings \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"spo2":96,"heart_rate":75}' | jq

# Test AI analysis
echo "4. Running AI analysis..."
curl -s $BASE_URL/ai/analyze/1 | jq

echo "API testing complete!"
```

Run with: `bash test_api.sh`
