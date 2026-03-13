from flask import Blueprint, request, jsonify
from database import db
from models import DailyCheckIn

bp = Blueprint('checkins', __name__, url_prefix='/api/checkins')

@bp.route('/', methods=['GET'])
def get_checkins():
    checkins = DailyCheckIn.query.all()
    return jsonify([c.to_dict() for c in checkins])


@bp.route('/', methods=['POST'])
def add_checkin():
    data = request.json

    checkin = DailyCheckIn(
        user_id=data.get("user_id"),
        mood=data.get("mood"),
        status="completed"
    )

    db.session.add(checkin)
    db.session.commit()

    return jsonify({"message": "Check-in recorded"})