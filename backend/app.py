from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()  # before importing auth, which reads SUPABASE_* at import time
from auth import authenticate  # noqa: E402

app = Flask(__name__)
ALLOWED_ORIGINS = ['https://agewell-pi.vercel.app', 'http://localhost:5173'] + [
    o.strip() for o in os.getenv('CORS_ORIGINS', '').split(',') if o.strip()]
CORS(app, origins=ALLOWED_ORIGINS)
app.before_request(authenticate)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # prescription and symptom photos; rejects bigger bodies with 413
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') or os.urandom(32).hex()  # sessions are unused; never a known default

from routes import (
    prescription_routes,
    diagnosis_routes,
    linking_routes,
    settings_routes,
)

app.register_blueprint(prescription_routes.bp)
app.register_blueprint(diagnosis_routes.bp)
app.register_blueprint(linking_routes.bp)
app.register_blueprint(settings_routes.bp)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.errorhandler(413)
def too_large(_):
    return jsonify({'error': 'That file is too large. Please use a photo under 10 MB.'}), 413


@app.after_request
def security_headers(response):
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Referrer-Policy', 'no-referrer')
    response.headers.setdefault('X-Frame-Options', 'DENY')
    response.headers.setdefault('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
    if request.path.startswith('/api'):
        response.headers['Cache-Control'] = 'no-store'  # responses hold health data: never cache in browsers or proxies
        response.headers.setdefault('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    return response


@app.after_request
def hide_server_errors(response):
    """Routes return str(e) on failure; log it, but never send DB/provider internals to clients."""
    if response.status_code >= 500 and response.is_json:
        app.logger.error('500 %s %s: %s', request.method, request.path, response.get_data(as_text=True)[:200])
        response.set_data(jsonify({'error': 'Something went wrong on our side. Please try again.'}).get_data())
    return response


@app.route('/health/deps', methods=['GET'])
def health_deps():
    """Which AI/voice providers are configured and reachable. Booleans only, no secrets."""
    import requests
    import time

    cached = getattr(health_deps, 'cache', None)
    if cached and cached[0] > time.time():
        return jsonify(cached[1])  # ponytail: 60s cache per instance so the public endpoint cannot burn quota

    def ping(url, headers):
        try:
            return requests.get(url, headers=headers, timeout=8).status_code == 200
        except requests.RequestException:
            return False

    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    gemini_key = os.getenv('GEMINI_API_KEY', '').strip()
    result = {
        'groq': {'configured': bool(groq_key), 'reachable': bool(groq_key) and ping(
            'https://api.groq.com/openai/v1/models', {'Authorization': f'Bearer {groq_key}'})},
        'gemini': {'configured': bool(gemini_key), 'reachable': bool(gemini_key) and ping(
            'https://generativelanguage.googleapis.com/v1beta/models', {'x-goog-api-key': gemini_key})},
        'bhashini': {'configured': bool((os.getenv('BHASHINI_API_KEY') or os.getenv('BHASHINI_INFERNCE') or '').strip())},
        'supabase': {'configured': bool(os.getenv('SUPABASE_URL')) and bool(
            os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SECRET_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY'))},
    }
    health_deps.cache = (time.time() + 60, result)
    return jsonify(result)


@app.route('/')
def index():
    return jsonify({
        'message': 'AGEWELL API - Elderly Medication & Wellness Management',
        'version': '1.0.0',
        'endpoints': {
            'diagnosis': '/api/diagnosis',
            'link': '/api/link',
            'settings': '/api/settings',
            'prescriptions': '/api/prescriptions'
        }
    })

if __name__ == '__main__':
    # Render runs gunicorn; this is for local dev. The Werkzeug debugger executes code, so debug never leaves localhost.
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    app.run(debug=debug, host='127.0.0.1' if debug else '0.0.0.0', port=int(os.getenv('PORT', '5001')))
