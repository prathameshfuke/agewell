import secrets
import string
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request

from services.settings_service import get_supabase_client

bp = Blueprint('linking', __name__, url_prefix='/api/link')

TABLE = 'caregiver_links'
PROFILES_TABLE = 'profiles'
CODE_LENGTH = 6
PENDING_WINDOW = timedelta(hours=24)
CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_now() -> str:
    return _utc_now().isoformat()


def _parse_iso_datetime(raw_value: str):
    if not raw_value:
        return None

    try:
        return datetime.fromisoformat(raw_value.replace('Z', '+00:00'))
    except ValueError:
        return None


def _pending_expired(link_row: dict) -> bool:
    created_at = _parse_iso_datetime(link_row.get('created_at'))
    if not created_at:
        return True

    return _utc_now() > (created_at + PENDING_WINDOW)


def _expires_at_iso(link_row: dict) -> str:
    created_at = _parse_iso_datetime(link_row.get('created_at'))
    if not created_at:
        created_at = _utc_now()
    return (created_at + PENDING_WINDOW).isoformat()


def _generate_link_code() -> str:
    return ''.join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


def _build_profiles_map(profile_rows):
    profile_map = {}
    for row in profile_rows or []:
        profile_map[row.get('id')] = {
            'id': row.get('id'),
            'full_name': row.get('full_name'),
            'avatar_url': row.get('avatar_url'),
            'role': row.get('role')
        }
    return profile_map


@bp.route('/generate-code', methods=['POST'])
def generate_code():
    try:
        data = request.get_json() or {}
        elder_id = (data.get('elder_id') or '').strip()

        if not elder_id:
            return jsonify({'error': 'elder_id is required'}), 400

        client = get_supabase_client()

        pending_response = (
            client.table(TABLE)
            .select('id, elder_id, caregiver_id, link_code, status, created_at')
            .eq('elder_id', elder_id)
            .eq('status', 'pending')
            .order('created_at', desc=True)
            .limit(1)
            .execute()
        )

        pending_rows = pending_response.data or []
        if pending_rows:
            pending_row = pending_rows[0]
            if not _pending_expired(pending_row):
                return jsonify({
                    'success': True,
                    'link_code': pending_row['link_code'],
                    'status': pending_row['status'],
                    'expires_at': _expires_at_iso(pending_row),
                    'reused': True
                })

            client.table(TABLE).update({'status': 'revoked'}).eq('id', pending_row['id']).execute()

        link_code = ''
        for _ in range(12):
            candidate = _generate_link_code()
            collision_check = (
                client.table(TABLE)
                .select('id')
                .eq('link_code', candidate)
                .in_('status', ['pending', 'active'])
                .limit(1)
                .execute()
            )
            if not (collision_check.data or []):
                link_code = candidate
                break

        if not link_code:
            return jsonify({'error': 'Unable to generate a unique code. Please retry.'}), 500

        payload = {
            'elder_id': elder_id,
            'link_code': link_code,
            'status': 'pending',
            'created_at': _iso_now()
        }

        insert_response = client.table(TABLE).insert(payload).execute()
        rows = insert_response.data or []
        link_row = rows[0] if rows else payload

        return jsonify({
            'success': True,
            'link_code': link_row['link_code'],
            'status': link_row['status'],
            'expires_at': _expires_at_iso(link_row),
            'reused': False
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@bp.route('/join', methods=['POST'])
def join_with_code():
    try:
        data = request.get_json() or {}
        caregiver_id = (data.get('caregiver_id') or '').strip()
        link_code = (data.get('link_code') or '').strip().upper()

        if not caregiver_id:
            return jsonify({'error': 'caregiver_id is required'}), 400

        if len(link_code) != CODE_LENGTH:
            return jsonify({'error': 'link_code must be a 6-character code'}), 400

        client = get_supabase_client()

        lookup_response = (
            client.table(TABLE)
            .select('id, elder_id, caregiver_id, link_code, status, created_at')
            .eq('link_code', link_code)
            .eq('status', 'pending')
            .limit(1)
            .execute()
        )
        rows = lookup_response.data or []

        if not rows:
            return jsonify({'error': 'Invalid or already used link code'}), 404

        pending_link = rows[0]

        if pending_link['elder_id'] == caregiver_id:
            return jsonify({'error': 'You cannot link to yourself'}), 400

        if _pending_expired(pending_link):
            client.table(TABLE).update({'status': 'revoked'}).eq('id', pending_link['id']).execute()
            return jsonify({'error': 'This code has expired. Ask the elder to generate a new code.'}), 410

        existing_response = (
            client.table(TABLE)
            .select('id, elder_id, caregiver_id, status, linked_at')
            .eq('elder_id', pending_link['elder_id'])
            .eq('caregiver_id', caregiver_id)
            .eq('status', 'active')
            .limit(1)
            .execute()
        )
        existing_rows = existing_response.data or []
        if existing_rows:
            existing = existing_rows[0]
            elder_profile_response = (
                client.table(PROFILES_TABLE)
                .select('id, full_name, avatar_url, role')
                .eq('id', existing['elder_id'])
                .limit(1)
                .execute()
            )
            elder_profile = (elder_profile_response.data or [{}])[0]

            return jsonify({
                'success': True,
                'already_linked': True,
                'link': existing,
                'elder': elder_profile
            })

        update_payload = {
            'caregiver_id': caregiver_id,
            'status': 'active',
            'linked_at': _iso_now()
        }

        update_response = (
            client.table(TABLE)
            .update(update_payload)
            .eq('id', pending_link['id'])
            .eq('status', 'pending')
            .execute()
        )
        updated_rows = update_response.data or []
        updated_link = updated_rows[0] if updated_rows else {
            **pending_link,
            **update_payload
        }

        elder_profile_response = (
            client.table(PROFILES_TABLE)
            .select('id, full_name, avatar_url, role')
            .eq('id', updated_link['elder_id'])
            .limit(1)
            .execute()
        )
        elder_profile_rows = elder_profile_response.data or []

        client.table(PROFILES_TABLE).update({
            'linked_elderly_id': updated_link['elder_id'],
            'updated_at': _iso_now()
        }).eq('id', caregiver_id).execute()

        return jsonify({
            'success': True,
            'link': {
                'id': updated_link.get('id'),
                'elder_id': updated_link.get('elder_id'),
                'caregiver_id': updated_link.get('caregiver_id'),
                'status': updated_link.get('status'),
                'linked_at': updated_link.get('linked_at')
            },
            'elder': elder_profile_rows[0] if elder_profile_rows else None
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@bp.route('/my-elders/<caregiver_id>', methods=['GET'])
def get_my_elders(caregiver_id):
    try:
        clean_caregiver_id = (caregiver_id or '').strip()
        if not clean_caregiver_id:
            return jsonify({'error': 'caregiver_id is required'}), 400

        client = get_supabase_client()
        links_response = (
            client.table(TABLE)
            .select('id, elder_id, caregiver_id, status, link_code, linked_at, created_at')
            .eq('caregiver_id', clean_caregiver_id)
            .eq('status', 'active')
            .order('linked_at', desc=True)
            .execute()
        )
        links = links_response.data or []

        elder_ids = [row.get('elder_id') for row in links if row.get('elder_id')]
        elder_map = {}
        if elder_ids:
            profile_rows = (
                client.table(PROFILES_TABLE)
                .select('id, full_name, avatar_url, role')
                .in_('id', elder_ids)
                .execute()
            ).data or []
            elder_map = _build_profiles_map(profile_rows)

        results = []
        for row in links:
            results.append({
                'id': row.get('id'),
                'status': row.get('status'),
                'link_code': row.get('link_code'),
                'linked_at': row.get('linked_at'),
                'created_at': row.get('created_at'),
                'elder': elder_map.get(row.get('elder_id'))
            })

        return jsonify({
            'success': True,
            'count': len(results),
            'elders': results
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500


@bp.route('/my-caregivers/<elder_id>', methods=['GET'])
def get_my_caregivers(elder_id):
    try:
        clean_elder_id = (elder_id or '').strip()
        if not clean_elder_id:
            return jsonify({'error': 'elder_id is required'}), 400

        client = get_supabase_client()
        links_response = (
            client.table(TABLE)
            .select('id, elder_id, caregiver_id, status, link_code, linked_at, created_at')
            .eq('elder_id', clean_elder_id)
            .eq('status', 'active')
            .order('linked_at', desc=True)
            .execute()
        )
        links = links_response.data or []

        caregiver_ids = [row.get('caregiver_id') for row in links if row.get('caregiver_id')]
        caregiver_map = {}
        if caregiver_ids:
            profile_rows = (
                client.table(PROFILES_TABLE)
                .select('id, full_name, avatar_url, role')
                .in_('id', caregiver_ids)
                .execute()
            ).data or []
            caregiver_map = _build_profiles_map(profile_rows)

        results = []
        for row in links:
            results.append({
                'id': row.get('id'),
                'status': row.get('status'),
                'link_code': row.get('link_code'),
                'linked_at': row.get('linked_at'),
                'created_at': row.get('created_at'),
                'caregiver': caregiver_map.get(row.get('caregiver_id'))
            })

        return jsonify({
            'success': True,
            'count': len(results),
            'caregivers': results
        })

    except Exception as exc:
        return jsonify({'error': str(exc)}), 500