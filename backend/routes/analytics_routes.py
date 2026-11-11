from flask import Blueprint, request
from backend.services.analytics_service import (
    get_admin_dashboard_metrics,
    get_officer_dashboard_metrics,
    get_citizen_dashboard_metrics
)
from backend.middleware.auth_middleware import jwt_required, role_required
from backend.utils.helpers import api_response, error_response

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/admin', methods=['GET'])
@jwt_required
@role_required('admin')
def admin_analytics():
    try:
        metrics = get_admin_dashboard_metrics()
        return api_response(metrics, "Admin aggregation metrics calculated successfully")
    except Exception as e:
        return error_response(f"Analytics computation failed: {str(e)}", 500)

@analytics_bp.route('/officer', methods=['GET'])
@jwt_required
@role_required('officer', 'admin')
def officer_analytics():
    try:
        metrics = get_officer_dashboard_metrics(request.user)
        return api_response(metrics, "Officer metrics retrieved")
    except Exception as e:
        return error_response(f"Officer metrics failed: {str(e)}", 500)

@analytics_bp.route('/citizen', methods=['GET'])
@jwt_required
def citizen_analytics():
    try:
        metrics = get_citizen_dashboard_metrics(request.user)
        return api_response(metrics, "Citizen metrics retrieved")
    except Exception as e:
        return error_response(f"Citizen metrics failed: {str(e)}", 500)
