from datetime import datetime
from database import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer)
    phone = db.Column(db.String(20), unique=True)
    role = db.Column(db.String(20), default='elderly')  # elderly, caregiver
    linked_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # For caregiver-elderly link
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    health_readings = db.relationship('HealthReading', backref='user', lazy=True, cascade='all, delete-orphan')
    medications = db.relationship('Medication', backref='user', lazy=True, cascade='all, delete-orphan')
    adherence_logs = db.relationship('AdherenceLog', backref='user', lazy=True, cascade='all, delete-orphan')
    check_ins = db.relationship('DailyCheckIn', backref='user', lazy=True, cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'phone': self.phone,
            'role': self.role,
            'linked_user_id': self.linked_user_id,
            'created_at': self.created_at.isoformat()
        }

class HealthReading(db.Model):
    __tablename__ = 'health_readings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    spo2 = db.Column(db.Float)
    heart_rate = db.Column(db.Float)
    temperature = db.Column(db.Float)
    blood_pressure_systolic = db.Column(db.Float)
    blood_pressure_diastolic = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'spo2': self.spo2,
            'heart_rate': self.heart_rate,
            'temperature': self.temperature,
            'blood_pressure_systolic': self.blood_pressure_systolic,
            'blood_pressure_diastolic': self.blood_pressure_diastolic,
            'timestamp': self.timestamp.isoformat(),
            'notes': self.notes
        }

class Medication(db.Model):
    __tablename__ = 'medications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    dosage = db.Column(db.String(100))
    frequency = db.Column(db.String(100))  # e.g., "twice daily", "every 8 hours"
    type = db.Column(db.String(20), default='pill')  # pill, liquid
    slot_number = db.Column(db.Integer)  # Device slot assignment
    schedule_times = db.Column(db.JSON)  # List of times: ["08:00", "14:00", "20:00"]
    special_instructions = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date, nullable=True)
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'type': self.type,
            'slot_number': self.slot_number,
            'schedule_times': self.schedule_times,
            'special_instructions': self.special_instructions,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'active': self.active,
            'created_at': self.created_at.isoformat()
        }

class AdherenceLog(db.Model):
    __tablename__ = 'adherence_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    medication_id = db.Column(db.Integer, db.ForeignKey('medications.id'), nullable=False)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    taken_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, taken, missed, late
    dispensing_attempts = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    medication = db.relationship('Medication', backref='adherence_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'medication_id': self.medication_id,
            'medication_name': self.medication.name if self.medication else None,
            'scheduled_time': self.scheduled_time.isoformat(),
            'taken_time': self.taken_time.isoformat() if self.taken_time else None,
            'status': self.status,
            'dispensing_attempts': self.dispensing_attempts,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }

class DailyCheckIn(db.Model):
    __tablename__ = 'daily_check_ins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    check_in_date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, completed, missed
    mood = db.Column(db.String(50))  # optional mood tracking
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'check_in_date': self.check_in_date.isoformat(),
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'status': self.status,
            'mood': self.mood,
            'notes': self.notes
        }

class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # health, medication, check_in, device
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    title = db.Column(db.String(200), nullable=False)
    message_elderly = db.Column(db.Text)  # Friendly message for elderly user
    message_caregiver = db.Column(db.Text)  # Detailed message for caregiver
    triggered_by = db.Column(db.JSON)  # Context data about what triggered the alert
    status = db.Column(db.String(20), default='active')  # active, acknowledged, resolved
    notification_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'title': self.title,
            'message_elderly': self.message_elderly,
            'message_caregiver': self.message_caregiver,
            'triggered_by': self.triggered_by,
            'status': self.status,
            'notification_sent': self.notification_sent,
            'created_at': self.created_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class Prescription(db.Model):
    __tablename__ = 'prescriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    image_path = db.Column(db.String(500))
    ocr_text = db.Column(db.Text)
    parsed_data = db.Column(db.JSON)  # Structured medication data
    processing_status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_path': self.image_path,
            'ocr_text': self.ocr_text,
            'parsed_data': self.parsed_data,
            'processing_status': self.processing_status,
            'uploaded_at': self.uploaded_at.isoformat(),
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50))  # medication, health_reading, alert, etc.
    entity_id = db.Column(db.Integer)
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
        }

class ElderProfile(db.Model):
    __tablename__ = 'elder_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Daily Life Template Data
    medical_conditions = db.Column(db.JSON)  # List: ['Arthritis', 'COPD', 'Hypertension']
    mobility_level = db.Column(db.String(20), default='moderate')  # high, moderate, low
    
    # Comfort Preferences
    temp_preference_min = db.Column(db.Float, default=20.0)
    temp_preference_max = db.Column(db.Float, default=24.0)
    humidity_preference_target = db.Column(db.Float, default=45.0)
    
    # Routine Data
    wake_up_time = db.Column(db.String(5), default="07:00")
    bed_time = db.Column(db.String(5), default="22:00")
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('elder_profile', uselist=False))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'medical_conditions': self.medical_conditions,
            'mobility_level': self.mobility_level,
            'temp_preference_min': self.temp_preference_min,
            'temp_preference_max': self.temp_preference_max,
            'humidity_preference_target': self.humidity_preference_target,
            'wake_up_time': self.wake_up_time,
            'bed_time': self.bed_time,
            'updated_at': self.updated_at.isoformat()
        }

class SmartDevice(db.Model):
    __tablename__ = 'smart_devices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Device Info
    device_type = db.Column(db.String(50), nullable=False)  # ac, humidifier, light, lock, purifier
    device_name = db.Column(db.String(100), nullable=False)
    room = db.Column(db.String(50), default='Living Room')
    
    # State
    is_active = db.Column(db.Boolean, default=False)
    current_setting = db.Column(db.String(50))  # "24°C", "High", "Dimmed"
    last_automation_trigger = db.Column(db.String(200))  # "Arthritis Morning Warmth"
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'device_type': self.device_type,
            'device_name': self.device_name,
            'room': self.room,
            'is_active': self.is_active,
            'current_setting': self.current_setting,
            'last_automation_trigger': self.last_automation_trigger,
            'updated_at': self.updated_at.isoformat()
        }
