"""Run: python test_auth.py  (no network: Supabase lookups are stubbed)."""
import auth
from app import app

ME, ELDER, STRANGER = (f'{c * 8}-0000-0000-0000-{c * 12}' for c in 'abc')
auth.SUPABASE_URL, auth.SERVICE_KEY = 'https://x.supabase.co', 'k'
auth.user_from_token = lambda t: ME if t == 'good' else None
auth.can_access = lambda caller, target: caller == target or target == ELDER


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
print('auth checks passed')
