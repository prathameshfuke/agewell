from flask import Flask, jsonify
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

# Initialize database
db.init_app(app)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Import models and create tables
with app.app_context():
    import models
    db.create_all()

# Import and register blueprints
#from routes import health_routes, medication_routes, ai_routes, user_routes, prescription_routes, notification_routes, automation_routes
from routes import (
    health_routes,
    medication_routes,
    ai_routes,
    user_routes,
    prescription_routes,
    notification_routes,
    automation_routes,
    device_routes,
    voice_routes,
    checkin_routes,
    environmental_routes,
    adherence_routes
)

app.register_blueprint(health_routes.bp)
app.register_blueprint(medication_routes.bp)
app.register_blueprint(ai_routes.bp)
app.register_blueprint(user_routes.bp)
app.register_blueprint(prescription_routes.bp)
app.register_blueprint(notification_routes.bp)
app.register_blueprint(automation_routes.bp)

# New APIs added for additional database tables
app.register_blueprint(device_routes.bp)          # dispenser_devices
app.register_blueprint(voice_routes.bp)           # voice_memos
app.register_blueprint(checkin_routes.bp)         # wellness_checkins
app.register_blueprint(environmental_routes.bp)   # environmental_readings
app.register_blueprint(adherence_routes.bp)       # adherence_logs

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

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
    app.run(debug=True, host='0.0.0.0', port=5001)
