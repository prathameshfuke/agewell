"""Run: python test_auth.py  (no network: Supabase lookups are stubbed)."""
import auth
from app import app

ME, ELDER, STRANGER = (f'{c * 8}-0000-0000-0000-{c * 12}' for c in 'abc')
auth.SUPABASE_URL, auth.SERVICE_KEY = 'https://x.supabase.co', 'k'
auth.user_from_token = lambda t: ME if t == 'good' else None
auth.can_access = lambda caller, target: caller == target or target == ELDER
SESSIONS = {'s' * 0 + '11111111-1111-1111-1111-111111111111': ME, '22222222-2222-2222-2222-222222222222': STRANGER}
auth.session_patient = SESSIONS.get


def call(path, token=None, method='get', **kw):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    return getattr(app.test_client(), method)(path, headers=headers, **kw).status_code


assert call('/health') == 200                                        # public
assert call('/api/diagnosis/history/' + ME) == 401                   # no token
assert call('/api/diagnosis/history/' + ME, 'bad') == 401            # bad token
assert call('/api/diagnosis/history/' + ME, 'good') != 401           # own data
assert call('/api/diagnosis/history/' + ELDER, 'good') != 403        # linked elder
assert call('/api/diagnosis/history/' + STRANGER, 'good') == 403     # someone else's
assert call('/api/link/my-elders/' + STRANGER, 'good') == 403        # caregiver_id must be self
assert call('/api/diagnosis/start', 'good', 'post', json={'patient_id': STRANGER, 'raw_complaint': 'x'}) == 403
assert call('/api/diagnosis/export-pdf/11111111-1111-1111-1111-111111111111', 'good') != 403   # own session
assert call('/api/diagnosis/export-pdf/22222222-2222-2222-2222-222222222222', 'good') == 403   # someone else's session
assert call('/api/diagnosis/audit/33333333-3333-3333-3333-333333333333', 'good') == 403        # unknown session fails closed
import os
os.environ['REQUIRE_AUTH'] = '0'; os.environ.pop('FLASK_DEBUG', None)
assert call('/api/diagnosis/history/' + ME) == 401                   # REQUIRE_AUTH=0 alone does not open the API

# CORS: only the real origins get the allow header
def cors(origin):
    return app.test_client().options('/health', headers={'Origin': origin, 'Access-Control-Request-Method': 'GET'}).headers.get('Access-Control-Allow-Origin')
assert cors('https://agewell-pi.vercel.app') == 'https://agewell-pi.vercel.app'
assert cors('http://localhost:5173') == 'http://localhost:5173'
assert cors('https://evil.example') is None

# Link-code join: the 11th wrong guess in the window is refused before any lookup
from routes import linking_routes as lr
lr._join_failures.clear()
assert not lr.join_blocked(ME)
for _ in range(lr.JOIN_MAX_FAILURES):
    lr.record_join_failure(ME)
assert lr.join_blocked(ME) and not lr.join_blocked(STRANGER)
assert call('/api/link/join', 'good', 'post', json={'caregiver_id': ME, 'link_code': 'ABCDEF'}) == 429

# Ids must be plain UUID strings: routes strip() them, so padding or a non-string must not skip the check
assert call('/api/link/generate-code', 'good', 'post', json={'elder_id': ' ' + STRANGER}) == 400
assert call('/api/link/generate-code', 'good', 'post', json={'elder_id': [STRANGER]}) == 400
assert call('/api/diagnosis/history/' + STRANGER + '%0A', 'good') == 400   # trailing newline
assert call('/api/link/generate-code', 'good', 'post', json={'elder_id': ELDER}) == 403  # caregiver cannot mint a code for the elder
assert call('/api/link/generate-code', 'good', 'post', json={'elder_id': STRANGER}) == 403
# session_id sent as a multipart form field is checked too (upload-image)
assert call('/api/diagnosis/upload-image', 'good', 'post', data={'session_id': '22222222-2222-2222-2222-222222222222'}) == 403
assert call('/api/prescriptions/upload', 'good', 'post', data={'user_id': STRANGER}) == 403
assert call('/api/settings/keys', 'good', 'post', json={'user_id': ELDER, 'setting_key': 'GROQ_API_KEY', 'setting_value': 'x'}) == 403  # not own

# Oversized JSON is refused before parsing
big = {'Authorization': 'Bearer good', 'Content-Type': 'application/json'}
assert app.test_client().post('/api/diagnosis/start', data='{"a":"' + 'x' * 70000 + '"}', headers=big).status_code == 413

# Rate limit: the 6th share in the window is a 429 with a message and Retry-After
auth._calls.clear()
share = {'session_id': '11111111-1111-1111-1111-111111111111'}
assert all(call('/api/diagnosis/share', 'good', 'post', json=share) != 429 for _ in range(5))
r = app.test_client().post('/api/diagnosis/share', json=share, headers={'Authorization': 'Bearer good'})
assert r.status_code == 429 and 'Retry-After' in r.headers and 'too often' in r.json['error']

# Security headers; API responses are never cached
r = app.test_client().get('/api/diagnosis/history/' + ME, headers={'Authorization': 'Bearer good'})
assert r.headers['Cache-Control'] == 'no-store' and r.headers['X-Content-Type-Options'] == 'nosniff' and r.headers['X-Frame-Options'] == 'DENY'

# Uploads are judged by content, not name
import io
from PIL import Image
from werkzeug.datastructures import FileStorage
from services.uploads import read_image
def upload(data, fmt=None):
    return FileStorage(io.BytesIO(data), filename='x.png')
def img(fmt):
    b = io.BytesIO(); Image.new('RGB', (8, 8)).save(b, fmt); return b.getvalue()
assert read_image(upload(img('PNG')))[0].size == (8, 8)
assert read_image(upload(img('JPEG')))[0].size == (8, 8)
for bad in (img('GIF'), b'<script>alert(1)</script>', b'', b'%PDF-1.4 ' + b'0' * 100, img('PNG')[:40]):
    try:
        read_image(upload(bad)); raise SystemExit('accepted a bad upload')
    except ValueError:
        pass
try:
    read_image(upload(b'\x89PNG' + b'0' * (9 * 1024 * 1024))); raise SystemExit('accepted an oversized upload')
except ValueError as exc:
    assert 'too large' in str(exc)

# Legacy SQLite routes are gone
assert call('/api/users/1', 'good') == 404

# Service key aliases
import importlib, os as _os
_os.environ.pop('SUPABASE_SERVICE_KEY', None); _os.environ.pop('SUPABASE_SECRET_KEY', None); _os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'role'
assert importlib.reload(auth).SERVICE_KEY == 'role'
print('auth checks passed')
