from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from werkzeug.utils import secure_filename
import os
from models import Prescription, User, AuditLog
from services.ocr_service import PrescriptionOCRService
from services.notification_service import NotificationService
from database import db

bp = Blueprint('prescriptions', __name__, url_prefix='/api/prescriptions')

ocr_service = PrescriptionOCRService()
notification_service = NotificationService()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
def upload_prescription():
    """
    Upload and process prescription image
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id', type=int)
        
        if not user_id:
            return jsonify({'error': 'user_id required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file
        filename = secure_filename(f"{user_id}_{datetime.utcnow().timestamp()}_{file.filename}")
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Create prescription record
        prescription = Prescription(
            user_id=user_id,
            image_path=filepath,
            processing_status='processing'
        )
        db.session.add(prescription)
        db.session.commit()
        
        # Process OCR
        result = ocr_service.process_prescription_image(filepath)
        
        if result['success']:
            prescription.ocr_text = result['ocr_text']
            prescription.parsed_data = result['parsed_data']
            prescription.processing_status = 'completed'
            prescription.processed_at = datetime.utcnow()
            
            # Create medications from parsed data
            medications = ocr_service.create_medications_from_prescription(
                user_id=user_id,
                parsed_data=result['parsed_data'],
                db=db
            )
            
            # Send notifications
            user = User.query.get(user_id)
            caregiver = User.query.filter_by(
                linked_user_id=user_id,
                role='caregiver'
            ).first()
            
            if user and caregiver:
                notification_service.send_prescription_processed_notification(
                    user_phone=user.phone,
                    caregiver_phone=caregiver.phone,
                    medication_count=len(medications)
                )
            
            # Audit log
            audit = AuditLog(
                user_id=user_id,
                action='prescription_processed',
                entity_type='prescription',
                entity_id=prescription.id,
                details={
                    'medications_count': len(medications),
                    'medications': [m.name for m in medications]
                }
            )
            db.session.add(audit)
        else:
            prescription.processing_status = 'failed'
        
        db.session.commit()
        
        return jsonify({
            'success': result['success'],
            'prescription': prescription.to_dict(),
            'medications_created': len(medications) if result['success'] else 0,
            'message': 'Prescription processed successfully' if result['success'] else 'OCR processing failed'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:user_id>', methods=['GET'])
def get_prescriptions(user_id):
    """
    Get all prescriptions for a user
    """
    try:
        prescriptions = Prescription.query.filter_by(
            user_id=user_id
        ).order_by(Prescription.uploaded_at.desc()).all()
        
        return jsonify({
            'success': True,
            'count': len(prescriptions),
            'prescriptions': [p.to_dict() for p in prescriptions]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/detail/<int:prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    """
    Get a specific prescription with details
    """
    try:
        prescription = Prescription.query.get(prescription_id)
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        return jsonify({
            'success': True,
            'prescription': prescription.to_dict()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/reprocess/<int:prescription_id>', methods=['POST'])
def reprocess_prescription(prescription_id):
    """
    Reprocess a prescription (if OCR failed or needs correction)
    """
    try:
        prescription = Prescription.query.get(prescription_id)
        if not prescription:
            return jsonify({'error': 'Prescription not found'}), 404
        
        prescription.processing_status = 'processing'
        db.session.commit()
        
        # Process OCR again
        result = ocr_service.process_prescription_image(prescription.image_path)
        
        if result['success']:
            prescription.ocr_text = result['ocr_text']
            prescription.parsed_data = result['parsed_data']
            prescription.processing_status = 'completed'
            prescription.processed_at = datetime.utcnow()
        else:
            prescription.processing_status = 'failed'
        
        db.session.commit()
        
        return jsonify({
            'success': result['success'],
            'prescription': prescription.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
