from flask import Blueprint, request
from backend.services.complaint_service import (
    create_complaint, get_complaints, get_complaint_by_id,
    assign_complaint, update_investigation_status, add_investigation_log
)
from backend.middleware.auth_middleware import jwt_required, role_required
from backend.utils.helpers import api_response, error_response

complaint_bp = Blueprint('complaints', __name__, url_prefix='/api/complaints')

@complaint_bp.route('', methods=['POST'])
@jwt_required
def create_new_complaint():
    try:
        data = request.get_json() or {}
        complaint = create_complaint(request.user, data)
        return api_response(complaint, "Complaint registered successfully", 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Failed to submit complaint: {str(e)}", 500)

@complaint_bp.route('', methods=['GET'])
@jwt_required
def list_complaints():
    try:
        query_params = request.args.to_dict()
        result = get_complaints(query_params, request.user)
        return api_response(result, "Complaints retrieved successfully")
    except Exception as e:
        return error_response(f"Failed to fetch complaints: {str(e)}", 500)

@complaint_bp.route('/<identifier>', methods=['GET'])
@jwt_required
def get_single_complaint(identifier):
    try:
        complaint = get_complaint_by_id(identifier, request.user)
        if not complaint:
            return error_response("Complaint not found", 404)
        return api_response(complaint, "Complaint details retrieved")
    except PermissionError as e:
        return error_response(str(e), 403)
    except Exception as e:
        return error_response(f"Failed to get complaint: {str(e)}", 500)

@complaint_bp.route('/<complaint_id>/assign', methods=['PUT'])
@jwt_required
@role_required('admin')
def assign_officer(complaint_id):
    try:
        data = request.get_json() or {}
        officer_id = data.get('officer_id')
        priority = data.get('priority')
        notes = data.get('notes', '')
        
        if not officer_id:
            return error_response("Officer ID is required", 400)
            
        updated = assign_complaint(complaint_id, officer_id, request.user, priority, notes)
        return api_response(updated, "Officer assigned successfully")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Failed to assign officer: {str(e)}", 500)

@complaint_bp.route('/<complaint_id>/status', methods=['PUT'])
@jwt_required
@role_required('officer', 'admin')
def update_status(complaint_id):
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        notes = data.get('notes', '')
        resolution_summary = data.get('resolution_summary')
        rejection_reason = data.get('rejection_reason')
        priority = data.get('priority')

        if not new_status:
            return error_response("New status is required", 400)

        updated = update_investigation_status(
            complaint_id, request.user, new_status,
            notes, resolution_summary, rejection_reason, priority
        )
        return api_response(updated, f"Complaint status updated to {new_status}")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Failed to update status: {str(e)}", 500)

@complaint_bp.route('/<complaint_id>/investigation-notes', methods=['POST'])
@jwt_required
@role_required('officer', 'admin')
def add_note(complaint_id):
    try:
        data = request.get_json() or {}
        note = add_investigation_log(complaint_id, request.user, data)
        return api_response(note, "Investigation entry added successfully", 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Failed to record investigation note: {str(e)}", 500)
