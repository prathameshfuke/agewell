"""
Sample data seeder for AGEWELL platform
Run this script to populate the database with test data
"""

from app import app
from database import db
from models import User, HealthReading, Medication, AdherenceLog, DailyCheckIn, Alert, ElderProfile, SmartDevice
from datetime import datetime, timedelta, time
import random

def seed_database():
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()
        
        # Create users
        print("Creating users...")
        
        elderly_user = User(
            name="John Smith",
            age=75,
            phone="1234567890",
            role="elderly"
        )
        db.session.add(elderly_user)
        db.session.flush()  # Get the ID
        
        caregiver_user = User(
            name="Mary Johnson",
            age=45,
            phone="0987654321",
            role="caregiver",
            linked_user_id=elderly_user.id
        )
        db.session.add(caregiver_user)
        db.session.commit()
        
        print(f"Created elderly user: {elderly_user.name} (ID: {elderly_user.id})")
        print(f"Created caregiver user: {caregiver_user.name} (ID: {caregiver_user.id})")
        
        # Create health readings for the past 7 days
        print("Creating health readings...")
        
        for days_ago in range(7):
            for reading_num in range(3):  # 3 readings per day
                timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=reading_num * 8)
                
                # Add some variation to make it realistic
                base_spo2 = 96
                base_hr = 75
                base_temp = 36.8
                
                reading = HealthReading(
                    user_id=elderly_user.id,
                    spo2=base_spo2 + random.uniform(-2, 2),
                    heart_rate=base_hr + random.uniform(-10, 10),
                    temperature=base_temp + random.uniform(-0.5, 0.5),
                    blood_pressure_systolic=120 + random.uniform(-10, 10),
                    blood_pressure_diastolic=80 + random.uniform(-5, 5),
                    timestamp=timestamp,
                    notes=f"Reading {reading_num + 1} for day {days_ago}"
                )
                db.session.add(reading)
        
        db.session.commit()
        print("Created 21 health readings")
        
        # Create medications
        print("Creating medications...")
        
        medications_data = [
            {
                'name': 'Aspirin',
                'dosage': '75mg',
                'frequency': 'once daily',
                'type': 'pill',
                'slot_number': 1,
                'schedule_times': ['08:00'],
                'special_instructions': 'Take with food'
            },
            {
                'name': 'Metformin',
                'dosage': '500mg',
                'frequency': 'twice daily',
                'type': 'pill',
                'slot_number': 2,
                'schedule_times': ['08:00', '20:00'],
                'special_instructions': 'Take with meals'
            },
            {
                'name': 'Lisinopril',
                'dosage': '10mg',
                'frequency': 'once daily',
                'type': 'pill',
                'slot_number': 3,
                'schedule_times': ['08:00'],
                'special_instructions': 'Take in the morning'
            },
            {
                'name': 'Vitamin D',
                'dosage': '1000 IU',
                'frequency': 'once daily',
                'type': 'pill',
                'slot_number': 4,
                'schedule_times': ['08:00'],
                'special_instructions': None
            },
            {
                'name': 'Cough Syrup',
                'dosage': '10ml',
                'frequency': 'thrice daily',
                'type': 'liquid',
                'slot_number': 8,
                'schedule_times': ['08:00', '14:00', '20:00'],
                'special_instructions': 'Shake well before use'
            }
        ]
        
        medications = []
        for med_data in medications_data:
            medication = Medication(
                user_id=elderly_user.id,
                name=med_data['name'],
                dosage=med_data['dosage'],
                frequency=med_data['frequency'],
                type=med_data['type'],
                slot_number=med_data['slot_number'],
                schedule_times=med_data['schedule_times'],
                special_instructions=med_data['special_instructions'],
                start_date=datetime.utcnow().date() - timedelta(days=7),
                active=True
            )
            db.session.add(medication)
            medications.append(medication)
        
        db.session.commit()
        print(f"Created {len(medications)} medications")
        
        # Create adherence logs for the past 7 days
        print("Creating adherence logs...")
        
        adherence_count = 0
        for days_ago in range(7):
            target_date = datetime.utcnow().date() - timedelta(days=days_ago)
            
            for medication in medications:
                for time_str in medication.schedule_times:
                    hour, minute = map(int, time_str.split(':'))
                    scheduled_datetime = datetime.combine(target_date, time(hour, minute))
                    
                    # Randomly determine status (90% taken, 5% missed, 5% late)
                    rand = random.random()
                    if rand < 0.90:
                        status = 'taken'
                        taken_time = scheduled_datetime + timedelta(minutes=random.randint(-5, 15))
                    elif rand < 0.95:
                        status = 'missed'
                        taken_time = None
                    else:
                        status = 'late'
                        taken_time = scheduled_datetime + timedelta(minutes=random.randint(30, 120))
                    
                    log = AdherenceLog(
                        user_id=elderly_user.id,
                        medication_id=medication.id,
                        scheduled_time=scheduled_datetime,
                        taken_time=taken_time,
                        status=status,
                        dispensing_attempts=1 if status == 'taken' else 0
                    )
                    db.session.add(log)
                    adherence_count += 1
        
        db.session.commit()
        print(f"Created {adherence_count} adherence logs")
        
        # Create daily check-ins
        print("Creating daily check-ins...")
        
        for days_ago in range(7):
            check_in_date = datetime.utcnow().date() - timedelta(days=days_ago)
            
            # 85% chance of check-in
            if random.random() < 0.85:
                check_in = DailyCheckIn(
                    user_id=elderly_user.id,
                    check_in_date=check_in_date,
                    check_in_time=datetime.combine(check_in_date, time(9, random.randint(0, 59))),
                    status='completed',
                    mood=random.choice(['good', 'great', 'okay', 'tired'])
                )
            else:
                check_in = DailyCheckIn(
                    user_id=elderly_user.id,
                    check_in_date=check_in_date,
                    status='missed'
                )
            
            db.session.add(check_in)
        
        db.session.commit()
        print("Created 7 daily check-ins")
        
        db.session.commit()
        print("Created 7 daily check-ins")

        # Create Elder Profile (Daily Life Template)
        print("Creating Elder Profile...")
        elder_profile = ElderProfile(
            user_id=elderly_user.id,
            medical_conditions=["Arthritis", "Hypertension"],
            mobility_level="moderate",
            temp_preference_min=22.0,
            temp_preference_max=25.0,
            humidity_preference_target=45.0,
            wake_up_time="07:00",
            bed_time="21:30"
        )
        db.session.add(elder_profile)
        db.session.commit()
        print("Created Elder Profile")

        # Create Smart Devices
        print("Creating Smart Devices...")
        devices_data = [
            {'name': 'Living Room AC', 'type': 'ac', 'room': 'Living Room', 'active': True, 'setting': '24°C'},
            {'name': 'Bedroom AC', 'type': 'ac', 'room': 'Bedroom', 'active': False, 'setting': 'Off'},
            {'name': 'Humidifier', 'type': 'humidifier', 'room': 'Bedroom', 'active': True, 'setting': '45%'},
            {'name': 'Air Purifier', 'type': 'purifier', 'room': 'Living Room', 'active': True, 'setting': 'Auto'},
            {'name': 'Front Door Lock', 'type': 'lock', 'room': 'Entrance', 'active': True, 'setting': 'Locked'},
            {'name': 'Main Lights', 'type': 'light', 'room': 'Living Room', 'active': True, 'setting': 'Warm White'}
        ]

        for device in devices_data:
            d = SmartDevice(
                user_id=elderly_user.id,
                device_name=device['name'],
                device_type=device['type'],
                room=device['room'],
                is_active=device['active'],
                current_setting=device['setting'],
                last_automation_trigger="Initial System Setup"
            )
            db.session.add(d)
        
        db.session.commit()
        print(f"Created {len(devices_data)} smart devices")
        
        # Create sample alerts
        print("Creating sample alerts...")
        
        alerts_data = [
            {
                'alert_type': 'health',
                'severity': 'medium',
                'title': 'SpO₂ Below Normal',
                'message_elderly': 'Your oxygen level is a bit low. Please rest and we will check on you.',
                'message_caregiver': 'SpO₂ reading of 93% detected. Monitor closely and check if symptoms persist.',
                'status': 'active'
            },
            {
                'alert_type': 'medication',
                'severity': 'high',
                'title': 'Missed Medication',
                'message_elderly': 'You missed your evening medicine. Please take it now if possible.',
                'message_caregiver': 'Evening dose of Metformin was missed. Please remind the user.',
                'status': 'active'
            }
        ]
        
        for alert_data in alerts_data:
            alert = Alert(
                user_id=elderly_user.id,
                alert_type=alert_data['alert_type'],
                severity=alert_data['severity'],
                title=alert_data['title'],
                message_elderly=alert_data['message_elderly'],
                message_caregiver=alert_data['message_caregiver'],
                status=alert_data['status'],
                triggered_by={'type': 'sample_data'}
            )
            db.session.add(alert)
        
        db.session.commit()
        print(f"Created {len(alerts_data)} sample alerts")
        
        print("\n" + "="*60)
        print("Database seeded successfully!")
        print("="*60)
        print(f"\nElderly User:")
        print(f"  Name: {elderly_user.name}")
        print(f"  Phone: {elderly_user.phone}")
        print(f"  ID: {elderly_user.id}")
        print(f"\nCaregiver User:")
        print(f"  Name: {caregiver_user.name}")
        print(f"  Phone: {caregiver_user.phone}")
        print(f"  ID: {caregiver_user.id}")
        print(f"\nLogin with these phone numbers to test the system!")
        print("="*60)

if __name__ == '__main__':
    seed_database()
