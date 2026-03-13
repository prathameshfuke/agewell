from flask import Blueprint, request, jsonify
from database import supabase

device_bp = Blueprint("device_bp", __name__)

@device_bp.route("/devices", methods=["GET"])
def get_devices():
    result = supabase.table("dispenser_devices").select("*").execute()
    return jsonify(result.data)

@device_bp.route("/devices", methods=["POST"])
def add_device():
    data = request.json
    result = supabase.table("dispenser_devices").insert(data).execute()
    return jsonify(result.data)