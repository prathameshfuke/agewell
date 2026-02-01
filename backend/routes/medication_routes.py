from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, time
from models import Medication, AdherenceLog, User, AuditLog
from database import db

bp = Blueprint('medications', __name__, url_prefix='/api/medications')

@bp.route('/', methods=['POST'])
def add_medication():
    """
    Add a new medication
    """
    try:
        data = request.get_json()
        
        medication = Medication(
            user_id=data['user_id'],
            name=data['name'],
            dosage=data.get('dosage'),
            frequency=data.get('frequency'),
            type=data.get('type', 'pill'),
            slot_number=data.get('slot_number'),
            schedule_times=data.get('schedule_times', []),
            special_instructions=data.get('special_instructions'),
            start_date=datetime.fromisoformat(data['start_date']).date() if 'start_date' in data else datetime.utcnow().date(),
            end_date=datetime.fromisoformat(data['end_date']).date() if data.get('end_date') else None,
            active=data.get('active', True)
        )
        
        db.session.add(medication)
        db.session.commit()
        
        # Create adherence logs for upcoming doses
        _create_adherence_logs(medication)
        
        # Audit log
        audit = AuditLog(
            user_id=data['user_id'],
            action='medication_added',
            entity_type='medication',
            entity_id=medication.id,
            details={'name': medication.name, 'type': medication.type}
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'medication': medication.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:user_id>', methods=['GET'])
def get_medications(user_id):
    """
    Get all medications for a user
    """
    try:
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        query = Medication.query.filter_by(user_id=user_id)
        
        if active_only:
            query = query.filter_by(active=True)
        
        medications = query.order_by(Medication.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'count': len(medications),
            'medications': [med.to_dict() for med in medications]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:medication_id>', methods=['GET'])
def get_medication(medication_id):
    """
    Get a specific medication
    """
    try:
        medication = Medication.query.get(medication_id)
        if not medication:
            return jsonify({'error': 'Medication not found'}), 404
        
        return jsonify({
            'success': True,
            'medication': medication.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:medication_id>', methods=['PUT'])
def update_medication(medication_id):
    """
    Update a medication
    """
    try:
        medication = Medication.query.get(medication_id)
        if not medication:
            return jsonify({'error': 'Medication not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            medication.name = data['name']
        if 'dosage' in data:
            medication.dosage = data['dosage']
        if 'frequency' in data:
            medication.frequency = data['frequency']
        if 'type' in data:
            medication.type = data['type']
        if 'slot_number' in data:
            medication.slot_number = data['slot_number']
        if 'schedule_times' in data:
            medication.schedule_times = data['schedule_times']
        if 'special_instructions' in data:
            medication.special_instructions = data['special_instructions']
        if 'active' in data:
            medication.active = data['active']
        if 'end_date' in data:
            medication.end_date = datetime.fromisoformat(data['end_date']).date()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'medication': medication.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:medication_id>', methods=['DELETE'])
def delete_medication(medication_id):
    """
    Delete (deactivate) a medication
    """
    try:
        medication = Medication.query.get(medication_id)
        if not medication:
            return jsonify({'error': 'Medication not found'}), 404
        
        medication.active = False
        medication.end_date = datetime.utcnow().date()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Medication deactivated'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/adherence', methods=['POST'])
def log_adherence():
    """
    Log medication adherence (taken/missed)
    """
    try:
        data = request.get_json()
        
        log = AdherenceLog.query.get(data['log_id'])
        if not log:
            return jsonify({'error': 'Adherence log not found'}), 404
        
        log.status = data['status']  # taken, missed, late
        log.taken_time = datetime.utcnow() if data['status'] == 'taken' else None
        log.notes = data.get('notes')
        
        db.session.commit()
        
        # Audit
        audit = AuditLog(
            user_id=log.user_id,
            action='medication_adherence_logged',
            entity_type='adherence_log',
            entity_id=log.id,
            details={'status': log.status, 'medication_id': log.medication_id}
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'log': log.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/adherence/<int:user_id>', methods=['GET'])
def get_adherence_logs(user_id):
    """
    Get adherence logs for a user
    """
    try:
        days = request.args.get('days', 7, type=int)
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        logs = AdherenceLog.query.filter(
            AdherenceLog.user_id == user_id,
            AdherenceLog.scheduled_time >= cutoff
        ).order_by(AdherenceLog.scheduled_time.desc()).all()
        
        return jsonify({
            'success': True,
            'count': len(logs),
            'logs': [log.to_dict() for log in logs]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/schedule/<int:user_id>', methods=['GET'])
def get_medication_schedule(user_id):
    """
    Get today's medication schedule for a user
    """
    try:
        date_str = request.args.get('date')
        if date_str:
            target_date = datetime.fromisoformat(date_str).date()
        else:
            target_date = datetime.utcnow().date()
        
        # Get active medications
        medications = Medication.query.filter_by(
            user_id=user_id,
            active=True
        ).all()
        
        schedule = []
        
        for med in medications:
            if not med.schedule_times:
                continue
            
            for time_str in med.schedule_times:
                # Create scheduled time
                hour, minute = map(int, time_str.split(':'))
                scheduled_datetime = datetime.combine(target_date, time(hour, minute))
                
                # Check if adherence log exists
                log = AdherenceLog.query.filter_by(
                    user_id=user_id,
                    medication_id=med.id,
                    scheduled_time=scheduled_datetime
                ).first()
                
                if not log:
                    # Create new log if it doesn't exist
                    log = AdherenceLog(
                        user_id=user_id,
                        medication_id=med.id,
                        scheduled_time=scheduled_datetime,
                        status='pending'
                    )
                    db.session.add(log)
                
                schedule.append({
                    'medication': med.to_dict(),
                    'scheduled_time': scheduled_datetime.isoformat(),
                    'log': log.to_dict() if log.id else None,
                    'status': log.status
                })
        
        db.session.commit()
        
        # Sort by scheduled time
        schedule.sort(key=lambda x: x['scheduled_time'])
        
        return jsonify({
            'success': True,
            'date': target_date.isoformat(),
            'count': len(schedule),
            'schedule': schedule
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/dispense', methods=['POST'])
def record_dispensing_attempt():
    """
    Record a medication dispensing attempt
    """
    try:
        data = request.get_json()
        
        log = AdherenceLog.query.get(data['log_id'])
        if not log:
            return jsonify({'error': 'Adherence log not found'}), 404
        
        log.dispensing_attempts += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'log': log.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def _create_adherence_logs(medication):
    """
    Helper function to create adherence logs for upcoming medication doses
    """
    if not medication.schedule_times:
        return
    
    # Create logs for next 7 days
    for day_offset in range(7):
        target_date = (datetime.utcnow() + timedelta(days=day_offset)).date()
        
        for time_str in medication.schedule_times:
            hour, minute = map(int, time_str.split(':'))
            scheduled_datetime = datetime.combine(target_date, time(hour, minute))
            
            # Only create if doesn't exist
            existing = AdherenceLog.query.filter_by(
                user_id=medication.user_id,
                medication_id=medication.id,
                scheduled_time=scheduled_datetime
            ).first()
            
            if not existing:
                log = AdherenceLog(
                    user_id=medication.user_id,
                    medication_id=medication.id,
                    scheduled_time=scheduled_datetime,
                    status='pending'
                )
                db.session.add(log)
    
    db.session.commit()
