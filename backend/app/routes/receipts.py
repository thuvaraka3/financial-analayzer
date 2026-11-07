import os
import json
import base64
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from ..services.firestore_service import FirestoreService
from ..ai.service_manager import AIServiceManager

receipts_bp = Blueprint('receipts', __name__)
db = FirestoreService()
ai_manager = AIServiceManager()

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.pdf'}

def allowed_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

@receipts_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_receipt():
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, BMP, WEBP, PDF'}), 400

    from flask import current_app
    upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_folder, exist_ok=True)

    filename = secure_filename(f"{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}")
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    extracted_data = None
    provider_used = None

    try:
        with open(filepath, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

        result, provider_used = ai_manager.analyze_receipt(image_data)
        if result:
            try:
                json_start = result.find('{')
                json_end = result.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = result[json_start:json_end]
                    extracted_data = json.loads(json_str)
            except json.JSONDecodeError:
                extracted_data = {'raw': result}
    except Exception as e:
        pass

    return jsonify({
        'message': 'Receipt uploaded successfully',
        'fileName': file.filename,
        'extractedData': extracted_data or {'merchantName': 'Unknown', 'amount': 0, 'category': 'Other'},
        'provider': provider_used
    }), 200
