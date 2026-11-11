"""Authentication for every /api route.

A request must carry a valid Supabase access token. Any user id in the URL, query or
JSON body must be the caller's own, or (for elders) belong to an elder the caller is
linked to. Enforced centrally so individual routes cannot forget it.
"""
import os
import re
import time

import requests
from flask import g, jsonify, request

SUPABASE_URL = (os.getenv('SUPABASE_URL') or '').rstrip('/')
SERVICE_KEY = (os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SECRET_KEY')
               or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or '')
CACHE_SECONDS = 60
UUID_RE = re.compile(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')  # use fullmatch: '$' would accept a trailing newline
MAX_JSON_BYTES = 64 * 1024  # JSON bodies are small; only multipart uploads may use the 10 MB app cap

PUBLIC_PATHS = {'/', '/health', '/health/deps'}
SELF_ONLY_KEYS = {'caregiver_id'}                      # must be the caller
ELDER_KEYS = {'user_id', 'patient_id', 'elder_id', 'elderly_id'}  # caller or a linked elder
SESSION_KEY = 'session_id'  # diagnosis session: its patient must be the caller or a linked elder

# Per-user limits on expensive routes: rule -> (max calls, window seconds). Keys are Flask url rules.
RATE_LIMITS = {
    '/api/diagnosis/start': (10, 600),
    '/api/diagnosis/answer': (40, 600),
    '/api/diagnosis/upload-image': (10, 600),
    '/api/diagnosis/generate-report': (10, 600),
    '/api/diagnosis/export-pdf/<session_id>': (20, 600),
    '/api/diagnosis/share': (5, 600),
    '/api/prescriptions/upload': (10, 600),
    '/api/link/generate-code': (10, 600),
    '/api/link/join': (30, 600),
    '/api/settings/keys': (20, 600),
}

# ponytail: in-process caches (single gunicorn worker per instance). Use Redis if scaled out.
_token_cache = {}   # token -> (user_id, expires_at)
_access_cache = {}  # (caller, target) -> (allowed, expires_at)
_calls = {}         # (caller, rule) -> [monotonic timestamps]; per worker, use Redis if scaled out


def _headers(token=None):
    return {'apikey': SERVICE_KEY, 'Authorization': f'Bearer {token or SERVICE_KEY}'}


def user_from_token(token):
    """Supabase user id for an access token, or None. Works with any JWT signing scheme."""
    hit = _token_cache.get(token)
    if hit and hit[1] > time.time():
        return hit[0]
    try:
        response = requests.get(f'{SUPABASE_URL}/auth/v1/user', headers=_headers(token), timeout=8)
    except requests.RequestException:
        return None
    user_id = response.json().get('id') if response.status_code == 200 else None
    if user_id:
        if len(_token_cache) > 1000:
            _token_cache.clear()
        _token_cache[token] = (user_id, time.time() + CACHE_SECONDS)
    return user_id


def can_access(caller, target):
    if caller == target:
        return True
    key = (caller, target)
    hit = _access_cache.get(key)
    if hit and hit[1] > time.time():
        return hit[0]
    try:
        link = requests.get(
            f'{SUPABASE_URL}/rest/v1/caregiver_links',
            params={'select': 'id', 'caregiver_id': f'eq.{caller}', 'elder_id': f'eq.{target}',
                    'status': 'eq.active', 'limit': '1'},
            headers=_headers(), timeout=8)
        profile = requests.get(
            f'{SUPABASE_URL}/rest/v1/profiles',
            params={'select': 'id', 'id': f'eq.{caller}', 'linked_elderly_id': f'eq.{target}', 'limit': '1'},
            headers=_headers(), timeout=8)
        allowed = bool(link.ok and link.json()) or bool(profile.ok and profile.json())
    except requests.RequestException:
        return False  # fail closed, and do not cache the failure
    if len(_access_cache) > 1000:
        _access_cache.clear()
    _access_cache[key] = (allowed, time.time() + CACHE_SECONDS)
    return allowed


def session_patient(session_id):
    """patient_id of a diagnosis session, or None when it does not exist."""
    try:
        rows = requests.get(
            f'{SUPABASE_URL}/rest/v1/diagnosis_sessions',
            params={'select': 'patient_id', 'id': f'eq.{session_id}', 'limit': '1'},
            headers=_headers(), timeout=8).json()
    except (requests.RequestException, ValueError):
        return None
    return rows[0]['patient_id'].lower() if isinstance(rows, list) and rows else None


def _sources():
    """Every place a client can put an id: URL path, query string, JSON body, form fields."""
    sources = [request.view_args or {}, request.args.to_dict(), request.form.to_dict()]
    body = request.get_json(silent=True)
    if isinstance(body, dict):
        sources.append(body)
    return sources


def _id_inputs():
    """(key, uuid) for every id-like input. Raises ValueError for an id that is not a plain UUID string:
    routes strip() their ids, so ' <uuid>' or a list would otherwise slip past the ownership check."""
    found = []
    for source in _sources():
        for key, value in source.items():
            if key not in SELF_ONLY_KEYS | ELDER_KEYS | {SESSION_KEY} or value in (None, ''):
                continue
            if not isinstance(value, str) or not UUID_RE.fullmatch(value):
                raise ValueError(key)
            found.append((key, value.lower()))
    return found


def rate_limited(caller):
    """Seconds to wait if the caller exceeded the limit on this route, else 0."""
    rule = request.url_rule.rule if request.url_rule else ''
    if rule not in RATE_LIMITS:
        return 0
    limit, window = RATE_LIMITS[rule]
    now = time.monotonic()
    key = (caller, rule)
    recent = [t for t in _calls.get(key, []) if now - t < window]
    if len(recent) >= limit:
        _calls[key] = recent
        return int(window - (now - recent[0])) + 1
    if len(_calls) > 5000:
        _calls.clear()
    _calls[key] = recent + [now]
    return 0


def is_self(user_id):
    """True when the caller is user_id (or auth is off in local dev)."""
    return 'user_id' not in g or g.user_id == str(user_id).strip().lower()


def authenticate():
    """Flask before_request hook."""
    if request.method == 'OPTIONS' or request.path in PUBLIC_PATHS or not request.path.startswith('/api'):
        return None
    if os.getenv('REQUIRE_AUTH', '1') == '0' and os.getenv('FLASK_DEBUG') == '1':
        return None  # local-dev escape hatch: ignored unless FLASK_DEBUG=1, so a stray prod env var cannot open the API
    if request.is_json and (request.content_length or 0) > MAX_JSON_BYTES:
        return jsonify({'error': 'That request is too large.'}), 413
    if not SUPABASE_URL or not SERVICE_KEY:
        return jsonify({'error': 'Authentication is not configured on the server.'}), 503

    header = request.headers.get('Authorization', '')
    token = header[7:].strip() if header.lower().startswith('bearer ') else ''
    caller = user_from_token(token) if token else None
    if not caller:
        return jsonify({'error': 'Sign in again to continue.'}), 401
    caller = caller.lower()
    g.user_id = caller

    try:
        ids = _id_inputs()
    except ValueError as bad:
        return jsonify({'error': f'{bad} is not a valid id.'}), 400

    for key, value in ids:
        if key == SESSION_KEY:
            patient = session_patient(value)
            allowed = bool(patient) and can_access(caller, patient)
            message = 'You do not have access to this session.'
        else:
            allowed = value == caller if key in SELF_ONLY_KEYS else can_access(caller, value)
            message = 'You do not have access to this person.'
        if not allowed:
            return jsonify({'error': message}), 403

    wait = rate_limited(caller)
    if wait:
        response = jsonify({'error': f'You are doing that too often. Please wait about {max(1, wait // 60)} minute(s) and try again.'})
        response.headers['Retry-After'] = str(wait)
        return response, 429
    return None
