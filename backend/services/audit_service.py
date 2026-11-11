from datetime import datetime, timezone
from flask import request
from bson import ObjectId
from backend.utils.db import get_db

def log_audit(action: str, target_entity: str, target_id: str = None, details: dict = None):
    """
    Records a secure audit log for administrative, forensic and compliance tracking.
    """
    try:
        db = get_db()
        user_info = getattr(request, 'user', {}) if request else {}
        
        user_id = user_info.get('user_id')
        user_email = user_info.get('email', 'system')
        user_role = user_info.get('role', 'system')
        
        ip_address = request.remote_addr if request else '127.0.0.1'
        user_agent = request.headers.get('User-Agent', 'Unknown') if request else 'Internal'

        audit_doc = {
            "user_id": ObjectId(user_id) if user_id else None,
            "user_email": user_email,
            "user_role": user_role,
            "action": action,
            "target_entity": target_entity,
            "target_id": str(target_id) if target_id else None,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc)
        }
        db.audit_logs.insert_one(audit_doc)
    except Exception as e:
        print(f"[AUDIT LOGGING ERROR] Failed to record audit log: {e}")
