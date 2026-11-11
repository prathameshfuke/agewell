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
print('auth checks passed')
