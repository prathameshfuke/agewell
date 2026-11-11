from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
from database import db

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agewell.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads/prescriptions'
app.config['DEBUG_TB_ENABLED'] = False
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

# Initialize database
db.init_app(app)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import models and create tables
with app.app_context():
    import models
    db.create_all()

# Import and register blueprints
from routes import (
    health_routes,
    medication_routes,
    ai_routes,
    user_routes,
    prescription_routes,
    notification_routes,
    automation_routes,
    diagnosis_routes,
    linking_routes,
    settings_routes,
)

app.register_blueprint(health_routes.bp)
app.register_blueprint(medication_routes.bp)
app.register_blueprint(ai_routes.bp)
app.register_blueprint(user_routes.bp)
app.register_blueprint(prescription_routes.bp)
app.register_blueprint(notification_routes.bp)
app.register_blueprint(automation_routes.bp)
app.register_blueprint(diagnosis_routes.bp)
app.register_blueprint(linking_routes.bp)
app.register_blueprint(settings_routes.bp)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.after_request
def hide_server_errors(response):
    """Routes return str(e) on failure; log it, but never send DB/provider internals to clients."""
    if response.status_code >= 500 and response.is_json:
        app.logger.error('500 %s %s: %s', request.method, request.path, response.get_data(as_text=True)[:500])
        response.set_data(jsonify({'error': 'Something went wrong on our side. Please try again.'}).get_data())
    return response


@app.route('/health/deps', methods=['GET'])
def health_deps():
    """Which AI/voice providers are configured and reachable. Booleans only, no secrets."""
    import requests

    def ping(url, headers):
        try:
            return requests.get(url, headers=headers, timeout=8).status_code == 200
        except requests.RequestException:
            return False

    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
    return jsonify({
        'groq': {'configured': bool(groq_key), 'reachable': bool(groq_key) and ping(
            'https://api.groq.com/openai/v1/models', {'Authorization': f'Bearer {groq_key}'})},
        'gemini': {'configured': bool(gemini_key), 'reachable': bool(gemini_key) and ping(
            'https://generativelanguage.googleapis.com/v1beta/models', {'x-goog-api-key': gemini_key})},
        'bhashini': {'configured': bool(os.getenv('BHASHINI_API_KEY', '').strip())},
        'supabase': {'configured': bool(os.getenv('SUPABASE_URL')) and bool(
            os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SECRET_KEY'))},
    })


@app.route('/')
def index():
    return jsonify({
        'message': 'AGEWELL API - Elderly Medication & Wellness Management',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'medications': '/api/medications',
            'ai': '/api/ai',
            'users': '/api/users',
            'prescriptions': '/api/prescriptions'
        }
    })

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', '0') == '1', host='0.0.0.0', port=5001)
