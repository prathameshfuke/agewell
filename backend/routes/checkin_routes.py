from flask import Blueprint, request, jsonify
from database import supabase

checkin_bp = Blueprint("checkin_bp", __name__)

@checkin_bp.route("/checkins", methods=["GET"])
def get_checkins():
    result = supabase.table("wellness_checkins").select("*").execute()
    return jsonify(result.data)

@checkin_bp.route("/checkins", methods=["POST"])
def add_checkin():
    data = request.json
    result = supabase.table("wellness_checkins").insert(data).execute()
    return jsonify(result.data)