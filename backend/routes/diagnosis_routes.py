from datetime import datetime
import io

from flask import Blueprint, jsonify, request, send_file

from services import session_store
from services.audit_service import get_session_audit_log, log_event
from services.emergency_alert_service import get_family_contacts, trigger_emergency_alerts
from services.groq_service import (
    extract_symptoms_and_first_question,
    generate_diagnosis_report,
    get_next_question,
)
from services.gemini_service import analyze_medical_image
from services.notification_service import NotificationService
from services.pdf_service import generate_diagnosis_pdf
from services.settings_service import get_user_setting

bp = Blueprint('diagnosis', __name__, url_prefix='/api/diagnosis')

notification_service = NotificationService()
MAX_SESSIONS_PER_DAY = 9999


def _get_header_ai_keys():
    return {
        'groq_api_key': (request.headers.get('X-User-Groq-Key') or '').strip(),
        'gemini_api_key': (request.headers.get('X-User-Gemini-Key') or '').strip(),
    }


def _safe_user_setting_lookup(user_id: str, key_name: str) -> str:
    try:
        return (get_user_setting(user_id, key_name) or '').strip()
    except Exception as exc:
        print(f'Warning: unable to read app setting {key_name} for {user_id}: {exc}')
        return ''


def _resolve_user_ai_keys(patient_id: str):
    header_keys = _get_header_ai_keys()

    if not patient_id:
        return header_keys

    user_groq_key = _safe_user_setting_lookup(patient_id, 'GROQ_API_KEY')
    user_gemini_key = _safe_user_setting_lookup(patient_id, 'GEMINI_API_KEY')

    return {
        'groq_api_key': user_groq_key or header_keys['groq_api_key'],
        'gemini_api_key': user_gemini_key or header_keys['gemini_api_key'],
    }


@bp.route('/start', methods=['POST'])
def start_session():
    """
    Start diagnosis intake session and return first question.
    """
    try:
        data = request.get_json() or {}

        patient_id = data.get('patient_id')
        raw_complaint = (data.get('raw_complaint') or '').strip()

        if not patient_id:
            return jsonify({'error': 'patient_id is required'}), 400

        if not raw_complaint:
            return jsonify({'error': 'Complaint cannot be empty'}), 400

        ai_keys = _resolve_user_ai_keys(patient_id)

        daily_count = session_store.get_daily_count(patient_id)
        if daily_count >= MAX_SESSIONS_PER_DAY:
            return jsonify({
                'error': 'Daily session limit reached (5 per day). Please try again tomorrow.'
            }), 429

        result = extract_symptoms_and_first_question(
            raw_complaint,
            api_key=ai_keys['groq_api_key'],
        )
        session = session_store.create_session(
            patient_id,
            raw_complaint,
            result.get('extracted_symptoms', []),
        )

        log_event(patient_id, session['id'], 'session_started', {
            'raw_complaint': raw_complaint,
            'extracted_symptoms': result.get('extracted_symptoms', []),
        })

        return jsonify({
            'success': True,
            'session_id': session['id'],
            'next_question': result.get('next_question'),
            'audio_base64': result.get('audio_base64'),
            'has_audio': result.get('has_audio', False),
            'audio_format': result.get('audio_format', 'wav'),
            'extracted_symptoms': result.get('extracted_symptoms', []),
            'progress': '1/8',
            'remaining_today': max(0, MAX_SESSIONS_PER_DAY - daily_count - 1),
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/answer', methods=['POST'])
def submit_answer():
    """
    Save one answer and return next question.
    """
    try:
        data = request.get_json() or {}

        session_id = data.get('session_id')
        answer = (data.get('answer') or '').strip().lower()
        current_question = (data.get('current_question') or '').strip()

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if answer not in ['yes', 'no', 'skip']:
            return jsonify({'error': 'answer must be yes, no, or skip'}), 400

        if not current_question:
            return jsonify({'error': 'current_question is required'}), 400

        ai_keys = _resolve_user_ai_keys(session['patient_id'])

        updated_session = session_store.append_qa(session_id, current_question, answer)
        if not updated_session:
            return jsonify({'error': 'Session not found'}), 404

        qa_pairs = updated_session.get('qa_pairs', [])

        result = get_next_question(
            updated_session.get('raw_complaint', ''),
            qa_pairs,
            api_key=ai_keys['groq_api_key'],
        )

        next_step = min(len(qa_pairs) + 1, 8)
        progress = f'{next_step}/8'

        log_event(updated_session['patient_id'], session_id, 'qa_answered', {
            'question': current_question,
            'answer': answer,
            'qa_count': len(qa_pairs),
        })

        return jsonify({
            'success': True,
            'next_question': result.get('next_question'),
            'audio_base64': result.get('audio_base64'),
            'has_audio': result.get('has_audio', False),
            'audio_format': result.get('audio_format', 'wav'),
            'done': result.get('done', False),
            'progress': progress,
            'qa_count': len(qa_pairs),
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/upload-image', methods=['POST'])
def upload_image():
    """
    Upload intake image and analyze it with Gemini service.
    """
    try:
        session_id = request.form.get('session_id')

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400

        ai_keys = _resolve_user_ai_keys(session['patient_id'])

        image_bytes = request.files['image'].read()
        result = analyze_medical_image(image_bytes, api_key=ai_keys['gemini_api_key'])

        session_store.update_session(session_id, {
            'image_observations': result.get('observations', ''),
            'image_flagged_urgent': bool(result.get('flagged_urgent', False)),
        })

        log_event(session['patient_id'], session_id, 'image_uploaded', {
            'flagged_urgent': bool(result.get('flagged_urgent', False)),
            'has_observations': bool(result.get('observations')),
        })

        return jsonify({
            'success': True,
            'observations': result.get('observations'),
            'flagged_urgent': bool(result.get('flagged_urgent', False))
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/generate-report', methods=['POST'])
def generate_report():
    """
    Generate final structured summary report for a diagnosis session.
    """
    try:
        data = request.get_json() or {}

        session_id = data.get('session_id')
        medications = data.get('medications', [])
        patient_name = data.get('patient_name', 'Patient')

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        ai_keys = _resolve_user_ai_keys(session['patient_id'])

        report = generate_diagnosis_report(
            session['raw_complaint'],
            session.get('qa_pairs', []),
            session.get('image_observations'),
            medications,
            api_key=ai_keys['groq_api_key'],
        )

        # If image analysis flagged urgent, upgrade urgency if model report is lower urgency.
        urgency_level = report.get('urgency_level', 'ROUTINE')
        if session.get('image_flagged_urgent') and urgency_level == 'ROUTINE':
            urgency_level = 'CONSULT_SOON'
            report['urgency_level'] = urgency_level
            report['urgency_reason'] = report.get(
                'urgency_reason',
                'Image review indicated findings that should be checked soon by a doctor.'
            )

        session_store.update_session(session_id, {
            'report_json': report,
            'urgency_level': urgency_level,
            'medication_flags': report.get('medication_flags', []),
        })

        session = session_store.get_session(session_id) or session

        log_event(session['patient_id'], session_id, 'report_generated', {
            'urgency_level': urgency_level,
            'symptom_count': len(session.get('extracted_symptoms', [])),
            'qa_count': len(session.get('qa_pairs', [])),
            'image_analyzed': bool(session.get('image_observations')),
            'medication_flags_count': len(report.get('medication_flags', [])),
        })

        alert_result = {'sent': False, 'channels': []}
        if urgency_level in ('GO_NOW', 'CONSULT_SOON'):
            alert_result = trigger_emergency_alerts(
                patient_id=session['patient_id'],
                patient_name=patient_name,
                session_id=session_id,
                urgency_level=urgency_level,
                urgency_reason=report.get('urgency_reason', 'Please seek medical attention'),
                report_summary=report.get('symptom_summary', ''),
            )

            log_event(session['patient_id'], session_id, 'alert_sent', {
                'urgency_level': urgency_level,
                'sent': bool(alert_result.get('sent')),
                'channels': alert_result.get('channels', []),
                'recipients_count': alert_result.get('recipients_count', 0),
            })

        return jsonify({
            'success': True,
            'report': report,
            'session_id': session_id,
            'urgency_level': urgency_level,
            'alert_sent': bool(alert_result.get('sent')),
            'alert_channels': alert_result.get('channels', []),
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/export-pdf/<session_id>', methods=['GET'])
def export_pdf(session_id):
    """
    Export generated diagnosis session report as a PDF.
    """
    try:
        patient_name = request.args.get('patient_name', 'Patient')

        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if not session.get('report_json'):
            return jsonify({'error': 'Report not generated yet'}), 400

        pdf_bytes = generate_diagnosis_pdf(session, patient_name)
        exported_at = datetime.utcnow().isoformat()
        session_store.update_session(session_id, {'exported_at': exported_at})

        log_event(session['patient_id'], session_id, 'pdf_exported', {
            'exported_at': exported_at,
        })

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'AgeWell_Diagnosis_{session_id[:8]}.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/history/<patient_id>', methods=['GET'])
def get_history(patient_id):
    """
    Return diagnosis session history for a patient.
    """
    try:
        rows = session_store.get_patient_sessions(patient_id)
        history = [
            {
                'session_id': row['id'],
                'patient_id': row['patient_id'],
                'raw_complaint': row['raw_complaint'],
                'extracted_symptoms': row.get('extracted_symptoms', []),
                'urgency_level': row.get('urgency_level'),
                'created_at': row['created_at'],
                'report_json': row.get('report_json'),
                'exported_at': row.get('exported_at'),
                'alert_sent': bool(row.get('alert_sent', False)),
                'acknowledged': bool(row.get('acknowledged', False)),
            }
            for row in rows
        ]

        return jsonify({
            'success': True,
            'history': history
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/share', methods=['POST'])
def share_report():
    """
    Share diagnosis summary with caregiver using existing notification pattern.
    """
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        report = session.get('report_json')

        if not report:
            return jsonify({'error': 'Report not generated yet'}), 400

        patient_name = data.get('patient_name') or 'Patient'

        contacts = get_family_contacts(session['patient_id'])
        notified = 0
        for contact in contacts:
            if not contact.get('phone'):
                continue

            notification_service.send_alert_notification(
                alert={
                    'title': 'Symptom Summary Shared',
                    'severity': 'medium',
                    'message_elderly': 'Your symptom summary has been shared with your caregiver.',
                    'message_caregiver': (
                        f'Symptom summary shared for {patient_name}. '
                        f"Urgency: {session.get('urgency_level', 'ROUTINE')}"
                    ),
                },
                user_phone=None,
                caregiver_phone=contact.get('phone'),
            )
            notified += 1

        log_event(session['patient_id'], session_id, 'alert_sent', {
            'trigger': 'manual_share',
            'urgency_level': session.get('urgency_level', 'ROUTINE'),
            'caregivers_notified': notified,
        })

        return jsonify({'success': True, 'caregivers_notified': notified})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/audit/<session_id>', methods=['GET'])
def get_audit_log(session_id):
    """
    Return full symptom audit log for a diagnosis session.
    """
    try:
        session = session_store.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        log_rows = get_session_audit_log(session_id)
        return jsonify({'success': True, 'log': log_rows})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
