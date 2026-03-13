from flask import Blueprint, jsonify

bp = Blueprint('voice', __name__, url_prefix='/api/voice')

@bp.route('/', methods=['GET'])
def voice_placeholder():
    return jsonify({"message": "Voice memo feature coming soon"})