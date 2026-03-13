from flask import Blueprint, request, jsonify
from database import db
from models import SmartDevice

bp = Blueprint('devices', __name__, url_prefix='/api/devices')

# Get all devices
@bp.route('/', methods=['GET'])
def get_devices():
    devices = SmartDevice.query.all()
    return jsonify([d.to_dict() for d in devices])


# Add device
@bp.route('/', methods=['POST'])
def add_device():
    data = request.json

    device = SmartDevice(
        user_id=data.get("user_id"),
        device_type=data.get("device_type"),
        device_name=data.get("device_name"),
        room=data.get("room")
    )

    db.session.add(device)
    db.session.commit()

    return jsonify({"message": "Device added successfully"})