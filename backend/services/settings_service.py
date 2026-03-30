import os
from datetime import datetime
from typing import Dict, Iterable, Optional

from supabase import Client, create_client

TABLE = 'app_settings'
ALLOWED_SETTING_KEYS = {'GROQ_API_KEY', 'GEMINI_API_KEY'}

_supabase_client: Optional[Client] = None


def get_supabase_service_key() -> str:
    # Support both legacy and new Supabase naming.
    return (
        os.getenv('SUPABASE_SERVICE_KEY', '').strip()
        or os.getenv('SUPABASE_SECRET_KEY', '').strip()
        or os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip()
    )


def get_supabase_client() -> Client:
    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv('SUPABASE_URL', '').strip()
    key = get_supabase_service_key()

    if not url or not key:
        raise RuntimeError('SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SECRET_KEY) must be set for settings persistence.')

    _supabase_client = create_client(url, key)
    return _supabase_client


def normalize_setting_key(setting_key: str) -> str:
    if not setting_key:
        return ''

    normalized = setting_key.strip().upper()
    return normalized if normalized in ALLOWED_SETTING_KEYS else ''


def get_user_setting(user_id: str, setting_key: str) -> str:
    normalized_key = normalize_setting_key(setting_key)
    if not user_id or not normalized_key:
        return ''

    response = (
        get_supabase_client()
        .table(TABLE)
        .select('setting_value')
        .eq('user_id', user_id)
        .eq('setting_key', normalized_key)
        .limit(1)
        .execute()
    )

    rows = response.data or []
    if not rows:
        return ''

    value = rows[0].get('setting_value')
    return str(value).strip() if value else ''


def get_user_settings(user_id: str, setting_keys: Optional[Iterable[str]] = None) -> Dict[str, str]:
    if not user_id:
        return {}

    query = get_supabase_client().table(TABLE).select('setting_key, setting_value').eq('user_id', user_id)

    if setting_keys:
        normalized_keys = [normalize_setting_key(key) for key in setting_keys]
        normalized_keys = [key for key in normalized_keys if key]
        if not normalized_keys:
            return {}
        query = query.in_('setting_key', normalized_keys)

    response = query.execute()
    rows = response.data or []

    result = {}
    for row in rows:
        setting_key = normalize_setting_key(row.get('setting_key'))
        if not setting_key:
            continue
        setting_value = row.get('setting_value')
        result[setting_key] = str(setting_value).strip() if setting_value else ''

    return result


def upsert_user_setting(user_id: str, setting_key: str, setting_value: str) -> Dict[str, str]:
    normalized_key = normalize_setting_key(setting_key)
    if not user_id or not normalized_key:
        raise ValueError('Invalid user_id or setting_key')

    clean_value = str(setting_value or '').strip()

    payload = {
        'user_id': user_id,
        'setting_key': normalized_key,
        'setting_value': clean_value,
        'updated_at': datetime.utcnow().isoformat()
    }

    get_supabase_client().table(TABLE).upsert(payload, on_conflict='user_id,setting_key').execute()
    return {
        'setting_key': normalized_key,
        'setting_value': clean_value
    }


def mask_setting_value(setting_value: str) -> str:
    clean_value = str(setting_value or '').strip()
    if not clean_value:
        return ''

    if len(clean_value) <= 6:
        return '*' * len(clean_value)

    return f"{'*' * (len(clean_value) - 6)}{clean_value[-6:]}"