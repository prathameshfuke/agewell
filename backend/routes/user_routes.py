from flask import Blueprint, request, jsonify
from datetime import datetime, date
from models import User, DailyCheckIn, AuditLog
from database import db

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/', methods=['POST'])
def create_user():
    """
    Create a new user (elderly or caregiver)
    """
    try:
        data = request.get_json()
        
        user = User(
            name=data['name'],
            age=data.get('age'),
            phone=data.get('phone'),
            role=data.get('role', 'elderly'),
            linked_user_id=data.get('linked_user_id')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """
    Get user details
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get linked user if exists
        linked_user = None
        if user.role == 'elderly':
            # Find caregiver
            caregiver = User.query.filter_by(
                linked_user_id=user_id,
                role='caregiver'
            ).first()
            if caregiver:
                linked_user = caregiver.to_dict()
        elif user.linked_user_id:
            # Get elderly user
            elderly = User.query.get(user.linked_user_id)
            if elderly:
                linked_user = elderly.to_dict()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'linked_user': linked_user
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Update user details
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'age' in data:
            user.age = data['age']
        if 'phone' in data:
            user.phone = data['phone']
        if 'linked_user_id' in data:
            user.linked_user_id = data['linked_user_id']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/', methods=['GET'])
def list_users():
    """
    List all users with optional filtering
    """
    try:
        role = request.args.get('role')
        
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        
        users = query.all()
        
        return jsonify({
            'success': True,
            'count': len(users),
            'users': [user.to_dict() for user in users]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/check-in', methods=['POST'])
def daily_check_in():
    """
    Record daily 'I'm OK' check-in
    """
    try:
        data = request.get_json()
        user_id = data['user_id']
        
        today = date.today()
        
        # Check if already checked in today
        existing = DailyCheckIn.query.filter_by(
            user_id=user_id,
            check_in_date=today
        ).first()
        
        if existing:
            existing.check_in_time = datetime.utcnow()
            existing.status = 'completed'
            existing.mood = data.get('mood')
            existing.notes = data.get('notes')
            check_in = existing
        else:
            check_in = DailyCheckIn(
                user_id=user_id,
                check_in_date=today,
                check_in_time=datetime.utcnow(),
                status='completed',
                mood=data.get('mood'),
                notes=data.get('notes')
            )
            db.session.add(check_in)
        
        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action='daily_check_in',
            entity_type='check_in',
            entity_id=check_in.id,
            details={'date': today.isoformat(), 'mood': check_in.mood}
        )
        db.session.add(audit)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'check_in': check_in.to_dict(),
            'message': 'Thank you for checking in! Have a great day!'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/check-in/<int:user_id>', methods=['GET'])
def get_check_ins(user_id):
    """
    Get check-in history for a user
    """
    try:
        days = request.args.get('days', 30, type=int)
        
        check_ins = DailyCheckIn.query.filter_by(
            user_id=user_id
        ).order_by(DailyCheckIn.check_in_date.desc()).limit(days).all()
        
        return jsonify({
            'success': True,
            'count': len(check_ins),
            'check_ins': [ci.to_dict() for ci in check_ins]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/check-in/status/<int:user_id>', methods=['GET'])
def check_in_status(user_id):
    """
    Check if user has checked in today
    """
    try:
        today = date.today()
        
        check_in = DailyCheckIn.query.filter_by(
            user_id=user_id,
            check_in_date=today
        ).first()
        
        return jsonify({
            'success': True,
            'checked_in_today': check_in is not None and check_in.status == 'completed',
            'check_in': check_in.to_dict() if check_in else None
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/link-caregiver', methods=['POST'])
def link_caregiver():
    """
    Link a caregiver to an elderly user
    """
    try:
        data = request.get_json()
        
        elderly_id = data['elderly_user_id']
        caregiver_id = data['caregiver_user_id']
        
        elderly = User.query.get(elderly_id)
        caregiver = User.query.get(caregiver_id)
        
        if not elderly or not caregiver:
            return jsonify({'error': 'User not found'}), 404
        
        if elderly.role != 'elderly':
            return jsonify({'error': 'First user must be elderly'}), 400
        
        if caregiver.role != 'caregiver':
            return jsonify({'error': 'Second user must be caregiver'}), 400
        
        caregiver.linked_user_id = elderly_id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Caregiver linked successfully',
            'elderly': elderly.to_dict(),
            'caregiver': caregiver.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
