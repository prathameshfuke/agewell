from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from models import Alert, AuditLog, AdherenceLog, DailyCheckIn, User
from database import db

bp = Blueprint('notifications', __name__, url_prefix='/api')

@bp.route('/notifications/<int:user_id>', methods=['GET'])
def get_notifications(user_id):
    """
    Get alerts/notifications for a user
    """
    try:
        # Check if user is caregiver - if so, get alerts for linked elderly
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        target_user_id = user_id
        if user.role == 'caregiver' and user.linked_user_id:
            target_user_id = user.linked_user_id
        
        # Get recent alerts (last 7 days)
        cutoff = datetime.utcnow() - timedelta(days=7)
        alerts = Alert.query.filter(
            Alert.user_id == target_user_id,
            Alert.created_at >= cutoff
        ).order_by(Alert.created_at.desc()).limit(50).all()
        
        # Count unread
        unread_count = Alert.query.filter(
            Alert.user_id == target_user_id,
            Alert.status == 'active'
        ).count()
        
        return jsonify({
            'success': True,
            'unread_count': unread_count,
            'notifications': [a.to_dict() for a in alerts]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/notifications/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_notification(alert_id):
    """
    Mark a notification as acknowledged/read
    """
    try:
        alert = Alert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        alert.status = 'acknowledged'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'alert': alert.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/notifications/mark-all-read/<int:user_id>', methods=['POST'])
def mark_all_read(user_id):
    """
    Mark all notifications as read for a user
    """
    try:
        Alert.query.filter(
            Alert.user_id == user_id,
            Alert.status == 'active'
        ).update({'status': 'acknowledged'})
        
        db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/activity/<int:user_id>', methods=['GET'])
def get_activity_timeline(user_id):
    """
    Get activity timeline for a user (for family dashboard)
    """
    try:
        # Check if requesting user is caregiver
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        target_user_id = user_id
        if user.role == 'caregiver' and user.linked_user_id:
            target_user_id = user.linked_user_id
        
        date_str = request.args.get('date')
        if date_str:
            target_date = datetime.fromisoformat(date_str).date()
        else:
            target_date = datetime.utcnow().date()
        
        activities = []
        
        # Get medication adherence logs for the day
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        adherence_logs = AdherenceLog.query.filter(
            AdherenceLog.user_id == target_user_id,
            AdherenceLog.scheduled_time >= start_of_day,
            AdherenceLog.scheduled_time <= end_of_day
        ).order_by(AdherenceLog.scheduled_time).all()
        
        for log in adherence_logs:
            if log.status == 'taken':
                activities.append({
                    'type': 'medication',
                    'title': f'{log.medication.name} taken',
                    'detail': f'{log.medication.dosage or "1 dose"} • On time',
                    'time': log.taken_time.strftime('%I:%M %p') if log.taken_time else log.scheduled_time.strftime('%I:%M %p'),
                    'timestamp': (log.taken_time or log.scheduled_time).isoformat(),
                    'status': 'success',
                    'icon': '💊'
                })
            elif log.status == 'missed':
                activities.append({
                    'type': 'medication',
                    'title': f'{log.medication.name} missed',
                    'detail': f'Scheduled at {log.scheduled_time.strftime("%I:%M %p")}',
                    'time': log.scheduled_time.strftime('%I:%M %p'),
                    'timestamp': log.scheduled_time.isoformat(),
                    'status': 'warning',
                    'icon': '⚠️'
                })
        
        # Get check-ins for the day
        check_ins = DailyCheckIn.query.filter(
            DailyCheckIn.user_id == target_user_id,
            DailyCheckIn.check_in_date == target_date
        ).all()
        
        for check_in in check_ins:
            mood_text = {
                'good': 'Feeling Good',
                'happy': 'Feeling Happy',
                'fine': 'Feeling Okay',
                'unwell': 'Not Feeling Well'
            }.get(check_in.mood, 'Checked In')
            
            activities.append({
                'type': 'check_in',
                'title': 'Wellness Check',
                'detail': f'Mood: "{mood_text}"',
                'time': check_in.check_in_time.strftime('%I:%M %p') if check_in.check_in_time else '—',
                'timestamp': check_in.check_in_time.isoformat() if check_in.check_in_time else None,
                'status': 'success',
                'icon': '💚'
            })
        
        # Get alerts for the day
        alerts = Alert.query.filter(
            Alert.user_id == target_user_id,
            Alert.created_at >= start_of_day,
            Alert.created_at <= end_of_day
        ).all()
        
        for alert in alerts:
            activities.append({
                'type': 'alert',
                'title': alert.title,
                'detail': alert.message_caregiver or alert.message_elderly,
                'time': alert.created_at.strftime('%I:%M %p'),
                'timestamp': alert.created_at.isoformat(),
                'status': 'warning' if alert.severity in ['high', 'critical'] else 'info',
                'icon': '🔔'
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x.get('timestamp') or '', reverse=False)
        
        # Group by time period
        grouped = {
            'morning': [],
            'afternoon': [],
            'evening': []
        }
        
        for activity in activities:
            if activity.get('timestamp'):
                hour = datetime.fromisoformat(activity['timestamp']).hour
                if hour < 12:
                    grouped['morning'].append(activity)
                elif hour < 17:
                    grouped['afternoon'].append(activity)
                else:
                    grouped['evening'].append(activity)
        
        return jsonify({
            'success': True,
            'date': target_date.isoformat(),
            'activities': activities,
            'grouped': grouped,
            'total_count': len(activities)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/alerts', methods=['POST'])
def create_alert():
    """
    Create a new alert/notification
    """
    try:
        data = request.get_json()
        
        alert = Alert(
            user_id=data['user_id'],
            alert_type=data.get('alert_type', 'general'),
            severity=data.get('severity', 'medium'),
            title=data['title'],
            message_elderly=data.get('message_elderly'),
            message_caregiver=data.get('message_caregiver'),
            triggered_by=data.get('triggered_by'),
            status='active'
        )
        
        db.session.add(alert)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'alert': alert.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
