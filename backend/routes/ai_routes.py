from flask import Blueprint, request, jsonify
from datetime import datetime
from models import User, HealthReading, Medication, AdherenceLog, Alert, AuditLog
from database import db
from services.ai_assistant import AIAssistant
from services.notification_service import NotificationService

bp = Blueprint('ai', __name__, url_prefix='/api/ai')

ai_assistant = AIAssistant(db)
notification_service = NotificationService()

@bp.route('/analyze/<int:user_id>', methods=['GET'])
def analyze_user(user_id):
    """
    Perform comprehensive AI analysis for a user
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Perform comprehensive analysis
        analysis = ai_assistant.comprehensive_analysis(user_id)
        
        # Generate alerts if needed
        alerts_generated = []
        
        # Health alerts
        if analysis['health'].get('alerts'):
            health_alert = ai_assistant.generate_alert(
                user_id=user_id,
                alert_type='health',
                health_analysis=analysis['health']
            )
            if health_alert:
                alerts_generated.append(health_alert)
                
                # Send notifications for critical/high severity
                if health_alert['severity'] in ['high', 'critical']:
                    caregiver = User.query.filter_by(
                        linked_user_id=user_id,
                        role='caregiver'
                    ).first()
                    
                    if caregiver:
                        notification_service.send_alert_notification(
                            alert=health_alert,
                            user_phone=user.phone,
                            caregiver_phone=caregiver.phone
                        )
        
        # Medication adherence alerts
        if analysis['medication_adherence'].get('alerts'):
            med_alert = ai_assistant.generate_alert(
                user_id=user_id,
                alert_type='medication',
                adherence_analysis=analysis['medication_adherence']
            )
            if med_alert:
                alerts_generated.append(med_alert)
                
                # Send notifications for high severity
                if med_alert['severity'] in ['high', 'critical']:
                    caregiver = User.query.filter_by(
                        linked_user_id=user_id,
                        role='caregiver'
                    ).first()
                    
                    if caregiver:
                        notification_service.send_alert_notification(
                            alert=med_alert,
                            user_phone=user.phone,
                            caregiver_phone=caregiver.phone
                        )
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'alerts_generated': alerts_generated
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/health-analysis/<int:user_id>', methods=['GET'])
def health_analysis(user_id):
    """
    Analyze health data for a user
    """
    try:
        hours = request.args.get('hours', 24, type=int)
        analysis = ai_assistant.analyze_health_data(user_id, hours=hours)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/medication-analysis/<int:user_id>', methods=['GET'])
def medication_analysis(user_id):
    """
    Analyze medication adherence for a user
    """
    try:
        days = request.args.get('days', 7, type=int)
        analysis = ai_assistant.check_medication_adherence(user_id, days=days)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/alerts/<int:user_id>', methods=['GET'])
def get_alerts(user_id):
    """
    Get alerts for a user
    """
    try:
        status = request.args.get('status', 'active')
        
        query = Alert.query.filter_by(user_id=user_id)
        
        if status != 'all':
            query = query.filter_by(status=status)
        
        alerts = query.order_by(Alert.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'alerts': [alert.to_dict() for alert in alerts]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """
    Acknowledge an alert
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
        return jsonify({'error': str(e)}), 500

@bp.route('/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """
    Resolve an alert
    """
    try:
        from datetime import datetime
        
        alert = Alert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        alert.status = 'resolved'
        alert.resolved_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'alert': alert.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    Get AI-generated recommendations for a user
    """
    try:
        analysis = ai_assistant.comprehensive_analysis(user_id)
        
        return jsonify({
            'success': True,
            'recommendations': analysis.get('recommendations', []),
            'severity': analysis.get('combined_severity', 'low')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
