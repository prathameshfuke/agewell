from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import HealthReading, User, AuditLog
from database import db

bp = Blueprint('health', __name__, url_prefix='/api/health')

@bp.route('/readings', methods=['POST'])
def add_health_reading():
    """
    Add a new health reading
    """
    try:
        data = request.get_json()
        
        reading = HealthReading(
            user_id=data['user_id'],
            spo2=data.get('spo2'),
            heart_rate=data.get('heart_rate'),
            temperature=data.get('temperature'),
            blood_pressure_systolic=data.get('blood_pressure_systolic'),
            blood_pressure_diastolic=data.get('blood_pressure_diastolic'),
            notes=data.get('notes')
        )
        
        db.session.add(reading)
        
        # Create audit log
        audit = AuditLog(
            user_id=data['user_id'],
            action='health_reading_added',
            entity_type='health_reading',
            entity_id=reading.id,
            details={
                'spo2': reading.spo2,
                'heart_rate': reading.heart_rate,
                'temperature': reading.temperature
            }
        )
        db.session.add(audit)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'reading': reading.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/readings/<int:user_id>', methods=['GET'])
def get_health_readings(user_id):
    """
    Get health readings for a user
    """
    try:
        # Get query parameters
        hours = request.args.get('hours', type=int)
        days = request.args.get('days', type=int)
        limit = request.args.get('limit', 100, type=int)
        
        query = HealthReading.query.filter_by(user_id=user_id)
        
        # Apply time filters
        if hours:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            query = query.filter(HealthReading.timestamp >= cutoff)
        elif days:
            cutoff = datetime.utcnow() - timedelta(days=days)
            query = query.filter(HealthReading.timestamp >= cutoff)
        
        readings = query.order_by(HealthReading.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'count': len(readings),
            'readings': [reading.to_dict() for reading in readings]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/readings/<int:reading_id>', methods=['GET'])
def get_health_reading(reading_id):
    """
    Get a specific health reading
    """
    try:
        reading = HealthReading.query.get(reading_id)
        if not reading:
            return jsonify({'error': 'Reading not found'}), 404
        
        return jsonify({
            'success': True,
            'reading': reading.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/readings/<int:reading_id>', methods=['PUT'])
def update_health_reading(reading_id):
    """
    Update a health reading
    """
    try:
        reading = HealthReading.query.get(reading_id)
        if not reading:
            return jsonify({'error': 'Reading not found'}), 404
        
        data = request.get_json()
        
        if 'spo2' in data:
            reading.spo2 = data['spo2']
        if 'heart_rate' in data:
            reading.heart_rate = data['heart_rate']
        if 'temperature' in data:
            reading.temperature = data['temperature']
        if 'blood_pressure_systolic' in data:
            reading.blood_pressure_systolic = data['blood_pressure_systolic']
        if 'blood_pressure_diastolic' in data:
            reading.blood_pressure_diastolic = data['blood_pressure_diastolic']
        if 'notes' in data:
            reading.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'reading': reading.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/stats/<int:user_id>', methods=['GET'])
def get_health_stats(user_id):
    """
    Get health statistics for a user
    """
    try:
        days = request.args.get('days', 7, type=int)
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        readings = HealthReading.query.filter(
            HealthReading.user_id == user_id,
            HealthReading.timestamp >= cutoff
        ).all()
        
        if not readings:
            return jsonify({
                'success': True,
                'message': 'No data available',
                'stats': {}
            })
        
        # Calculate statistics
        stats = {}
        
        metrics = ['spo2', 'heart_rate', 'temperature', 
                  'blood_pressure_systolic', 'blood_pressure_diastolic']
        
        for metric in metrics:
            values = [getattr(r, metric) for r in readings if getattr(r, metric) is not None]
            
            if values:
                stats[metric] = {
                    'average': round(sum(values) / len(values), 2),
                    'min': min(values),
                    'max': max(values),
                    'latest': values[0] if readings else None,
                    'count': len(values)
                }
        
        return jsonify({
            'success': True,
            'period_days': days,
            'total_readings': len(readings),
            'stats': stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
