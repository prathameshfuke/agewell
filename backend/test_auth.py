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

# Legacy SQLite routes are gone
assert call('/api/users/1', 'good') == 404

# Service key aliases
import importlib, os as _os
_os.environ.pop('SUPABASE_SERVICE_KEY', None); _os.environ.pop('SUPABASE_SECRET_KEY', None); _os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'role'
assert importlib.reload(auth).SERVICE_KEY == 'role'
print('auth checks passed')
