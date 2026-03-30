from flask import Blueprint, jsonify, request

from services.settings_service import (
    ALLOWED_SETTING_KEYS,
    get_user_settings,
    mask_setting_value,
    normalize_setting_key,
    upsert_user_setting,
)

bp = Blueprint('settings', __name__, url_prefix='/api/settings')


def _normalize_payload_keys(data):
    raw_keys = data.get('keys')
    if isinstance(raw_keys, dict):
        return raw_keys

    setting_key = data.get('setting_key') or data.get('key')
    if not setting_key:
        return {}

    setting_value = data.get('setting_value')
    if setting_value is None:
        setting_value = data.get('value', '')

    return {setting_key: setting_value}


@bp.route('/keys', methods=['POST'])
def save_keys():
    try:
        data = request.get_json() or {}
        user_id = (data.get('user_id') or '').strip()
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        payload_keys = _normalize_payload_keys(data)
        if not payload_keys:
            return jsonify({'error': 'No keys provided. Use setting_key/setting_value or keys object.'}), 400

        saved = []
        invalid_keys = []

        for key_name, key_value in payload_keys.items():
            normalized_key = normalize_setting_key(key_name)
            if not normalized_key:
                invalid_keys.append(str(key_name))
                continue

            record = upsert_user_setting(user_id, normalized_key, str(key_value or ''))
            saved.append({
                'setting_key': record['setting_key'],
                'masked_value': mask_setting_value(record['setting_value']),
                'has_value': bool(record['setting_value'])
            })

        if not saved:
            return jsonify({
                'error': 'No valid keys provided.',
                'allowed_keys': sorted(ALLOWED_SETTING_KEYS),
                'invalid_keys': invalid_keys
            }), 400

        return jsonify({
            'success': True,
            'saved': saved,
            'invalid_keys': invalid_keys
        })

    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@bp.route('/keys/<user_id>', methods=['GET'])
def get_keys(user_id):
    try:
        clean_user_id = (user_id or '').strip()
        if not clean_user_id:
            return jsonify({'error': 'user_id is required'}), 400

        settings = get_user_settings(clean_user_id, ALLOWED_SETTING_KEYS)

        key_rows = []
        for key_name in sorted(ALLOWED_SETTING_KEYS):
            raw_value = settings.get(key_name, '')
            key_rows.append({
                'setting_key': key_name,
                'masked_value': mask_setting_value(raw_value),
                'has_value': bool(raw_value)
            })

        return jsonify({
            'success': True,
            'keys': key_rows
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500