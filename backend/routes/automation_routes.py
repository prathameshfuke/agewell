from flask import Blueprint, request, jsonify
from models import ElderProfile, SmartDevice, db
from services.automation_service import AutomationService

bp = Blueprint('automation', __name__, url_prefix='/api/automation')

@bp.route('/profile/<int:user_id>', methods=['GET'])
def get_elder_profile(user_id):
    profile = ElderProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify({'success': True, 'profile': profile.to_dict()})

@bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_elder_profile(user_id):
    profile = ElderProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
        
    data = request.get_json()
    if 'medical_conditions' in data:
        profile.medical_conditions = data['medical_conditions']
    if 'temp_preference_min' in data:
        profile.temp_preference_min = data['temp_preference_min']
    if 'temp_preference_max' in data:
        profile.temp_preference_max = data['temp_preference_max']
        
    db.session.commit()
    return jsonify({'success': True, 'profile': profile.to_dict()})

@bp.route('/devices/<int:user_id>', methods=['GET'])
def get_smart_devices(user_id):
    devices = SmartDevice.query.filter_by(user_id=user_id).all()
    return jsonify({
        'success': True, 
        'devices': [d.to_dict() for d in devices]
    })

@bp.route('/devices/<int:device_id>', methods=['PUT'])
def update_device_status(device_id):
    """
    Manual override or simulation of device state
    """
    device = SmartDevice.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
        
    data = request.get_json()
    if 'is_active' in data:
        device.is_active = data['is_active']
    if 'current_setting' in data:
        device.current_setting = data['current_setting']
        
    device.updated_at = db.session.query(db.func.now()).scalar() 
    db.session.commit()
    
    return jsonify({'success': True, 'device': device.to_dict()})

@bp.route('/evaluate/<int:user_id>', methods=['POST'])
def trigger_evaluation(user_id):
    """
    Manually trigger the automation engine (e.g. for demo simulation)
    """
    actions = AutomationService.evaluate_environment(user_id)
    return jsonify({
        'success': True,
        'triggered_actions': actions
    })

@bp.route('/simulate/<int:user_id>', methods=['POST'])
def simulate_event(user_id):
    """
    Force a specific event simulation (fall, cold, morning)
    """
    data = request.get_json()
    event = data.get('event')
    
    if not event:
        return jsonify({'error': 'Event type required'}), 400
        
    actions = AutomationService.simulate_event(user_id, event)
    return jsonify({
        'success': True,
        'triggered_actions': actions
    })
