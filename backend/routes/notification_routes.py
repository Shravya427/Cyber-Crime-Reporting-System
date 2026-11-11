from flask import Blueprint, request
from backend.services.notification_service import (
    get_user_notifications,
    mark_as_read,
    mark_all_as_read
)
from backend.middleware.auth_middleware import jwt_required
from backend.utils.helpers import api_response, error_response

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@jwt_required
def list_notifications():
    try:
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        items = get_user_notifications(request.user['user_id'], unread_only=unread_only)
        return api_response(items, "Notifications retrieved")
    except Exception as e:
        return error_response(str(e), 500)

@notification_bp.route('/<notif_id>/read', methods=['PUT'])
@jwt_required
def read_single(notif_id):
    try:
        success = mark_as_read(notif_id, request.user['user_id'])
        return api_response({"success": success}, "Notification marked as read")
    except Exception as e:
        return error_response(str(e), 500)

@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required
def read_all():
    try:
        count = mark_all_as_read(request.user['user_id'])
        return api_response({"updated_count": count}, f"{count} notifications marked as read")
    except Exception as e:
        return error_response(str(e), 500)
