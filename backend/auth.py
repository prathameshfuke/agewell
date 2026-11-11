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
SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SECRET_KEY') or ''
CACHE_SECONDS = 60
UUID_RE = re.compile(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')

PUBLIC_PATHS = {'/', '/health', '/health/deps'}
SELF_ONLY_KEYS = {'caregiver_id'}                      # must be the caller
ELDER_KEYS = {'user_id', 'patient_id', 'elder_id', 'elderly_id'}  # caller or a linked elder
SESSION_KEY = 'session_id'  # diagnosis session: its patient must be the caller or a linked elder

# ponytail: in-process caches (single gunicorn worker per instance). Use Redis if scaled out.
_token_cache = {}   # token -> (user_id, expires_at)
_access_cache = {}  # (caller, target) -> (allowed, expires_at)


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


def _session_ids():
    sources = [request.view_args or {}, request.args.to_dict()]
    body = request.get_json(silent=True)
    if isinstance(body, dict):
        sources.append(body)
    return [str(src[SESSION_KEY]) for src in sources if UUID_RE.match(str(src.get(SESSION_KEY, '')))]


def _candidate_ids():
    """(key, value) pairs for every user-id-like input in the request."""
    sources = [request.view_args or {}, request.args.to_dict()]
    body = request.get_json(silent=True)
    if isinstance(body, dict):
        sources.append(body)
    for source in sources:
        for key, value in source.items():
            if key in SELF_ONLY_KEYS | ELDER_KEYS and isinstance(value, str) and UUID_RE.match(value):
                yield key, value.lower()


def authenticate():
    """Flask before_request hook."""
    if request.method == 'OPTIONS' or request.path in PUBLIC_PATHS or not request.path.startswith('/api'):
        return None
    if os.getenv('REQUIRE_AUTH', '1') == '0' and os.getenv('FLASK_DEBUG') == '1':
        return None  # local-dev escape hatch: ignored unless FLASK_DEBUG=1, so a stray prod env var cannot open the API
    if not SUPABASE_URL or not SERVICE_KEY:
        return jsonify({'error': 'Authentication is not configured on the server.'}), 503

    header = request.headers.get('Authorization', '')
    token = header[7:].strip() if header.lower().startswith('bearer ') else ''
    caller = user_from_token(token) if token else None
    if not caller:
        return jsonify({'error': 'Sign in again to continue.'}), 401
    caller = caller.lower()
    g.user_id = caller

    for key, value in _candidate_ids():
        allowed = value == caller if key in SELF_ONLY_KEYS else can_access(caller, value)
        if not allowed:
            return jsonify({'error': 'You do not have access to this person.'}), 403

    for session_id in _session_ids():
        patient = session_patient(session_id)
        if not patient or not can_access(caller, patient):
            return jsonify({'error': 'You do not have access to this session.'}), 403
    return None
