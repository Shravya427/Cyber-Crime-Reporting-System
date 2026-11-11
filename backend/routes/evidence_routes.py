from flask import Blueprint, request, Response
from backend.services.evidence_service import upload_evidence_file, get_evidence_file_stream, list_evidence_for_complaint
from backend.middleware.auth_middleware import jwt_required
from backend.utils.helpers import api_response, error_response

evidence_bp = Blueprint('evidence', __name__, url_prefix='/api/evidence')

@evidence_bp.route('/upload/<complaint_id>', methods=['POST'])
@jwt_required
def upload_file(complaint_id):
    try:
        if 'file' not in request.files:
            return error_response("No file field provided in form data", 400)
            
        file_obj = request.files['file']
        evidence_type = request.form.get('evidence_type', 'Screenshot')
        description = request.form.get('description', '')

        result = upload_evidence_file(
            file_obj=file_obj,
            complaint_id_str=complaint_id,
            uploaded_by_id_str=request.user['user_id'],
            evidence_type=evidence_type,
            description=description
        )
        return api_response(result, "Evidence uploaded and securely indexed into GridFS", 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Evidence upload failed: {str(e)}", 500)

@evidence_bp.route('/<evidence_id>', methods=['GET'])
def download_evidence(evidence_id):
    try:
        doc, gridfs_file = get_evidence_file_stream(evidence_id)
        if not doc or not gridfs_file:
            return error_response("Evidence file not found", 404)
        
        response = Response(gridfs_file.read(), mimetype=doc.get('content_type', 'application/octet-stream'))
        # If previewable in browser (images, pdf), set inline, else attachment
        ct = doc.get('content_type', '')
        disp = "inline" if ct.startswith('image/') or ct == 'application/pdf' else "attachment"
        response.headers['Content-Disposition'] = f'{disp}; filename="{doc.get("original_name", "evidence")}"'
        response.headers['X-SHA256-Checksum'] = doc.get('sha256_hash', '')
        return response
    except Exception as e:
        return error_response(f"Failed to stream evidence file: {str(e)}", 500)

@evidence_bp.route('/complaint/<complaint_id>', methods=['GET'])
@jwt_required
def get_complaint_evidence(complaint_id):
    try:
        evidence_items = list_evidence_for_complaint(complaint_id)
        return api_response(evidence_items, "Evidence records retrieved")
    except Exception as e:
        return error_response(str(e), 500)
