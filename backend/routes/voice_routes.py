from flask import Blueprint, request, jsonify
from database import supabase

voice_bp = Blueprint("voice_bp", __name__)

@voice_bp.route("/voice-memos", methods=["GET"])
def get_voice_memos():
    result = supabase.table("voice_memos").select("*").execute()
    return jsonify(result.data)

@voice_bp.route("/voice-memos", methods=["POST"])
def send_voice_memo():
    data = request.json
    result = supabase.table("voice_memos").insert(data).execute()
    return jsonify(result.data)