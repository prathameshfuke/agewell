from datetime import datetime

from flask import Blueprint, jsonify, request

from services.ocr_service import PrescriptionOCRService
from services.uploads import read_image

bp = Blueprint('prescriptions', __name__, url_prefix='/api/prescriptions')

ocr_service = PrescriptionOCRService()


@bp.route('/upload', methods=['POST'])
def upload_prescription():
    """OCR a prescription photo and return the parsed medicines for the user to review.

    Nothing is stored here: the review screen saves confirmed medicines to Supabase.
    `user_id` (a Supabase uuid) is ownership-checked centrally by auth.py.
    """
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'Choose a photo of the prescription first.'}), 400
    try:
        image, _ = read_image(file)  # size cap + magic-byte check; the filename is never used
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    result = ocr_service.process_prescription_image(image)
    if not result['success']:
        return jsonify({'success': False, 'error': 'We could not read this prescription. Try a clearer, well-lit photo.'}), 422

    parsed = result['parsed_data']
    return jsonify({
        'success': True,
        'prescription': {
            'ocr_text': result['ocr_text'],
            'parsed_data': parsed,
            'processing_status': 'completed',
            'processed_at': datetime.utcnow().isoformat(),
        },
        'medications_found': len(parsed.get('medications', [])),
    })
