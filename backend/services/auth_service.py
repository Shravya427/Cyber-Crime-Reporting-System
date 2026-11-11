from datetime import datetime, timezone
from bson import ObjectId
from backend.utils.db import get_db, serialize_doc, run_transaction
from backend.utils.helpers import hash_password, check_password, generate_jwt
from backend.services.audit_service import log_audit
from backend.services.notification_service import create_notification

def register_user(data: dict):
    db = get_db()
    email = data.get('email', '').strip().lower()
    full_name = data.get('full_name', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'citizen')
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    id_proof_type = data.get('id_proof_type', '')
    id_proof_number = data.get('id_proof_number', '').strip()

    if not email or not password or not full_name:
        raise ValueError("Full name, email, and password are required")
    
    if role not in ['citizen', 'officer', 'admin']:
        raise ValueError("Invalid role specified")

    # Check if email exists
    existing = db.users.find_one({"email": email})
    if existing:
        raise ValueError("An account with this email address already exists")

    pw_hash = hash_password(password)

    user_doc = {
        "full_name": full_name,
        "email": email,
        "password_hash": pw_hash,
        "phone": phone,
        "role": role,
        "address": address,
        "id_proof_type": id_proof_type,
        "id_proof_number": id_proof_number,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }

    def _do_register(session=None):
        res = db.users.insert_one(user_doc, session=session)
        user_id = res.inserted_id
        officer_info = None

        if role == 'officer':
            badge_number = data.get('badge_number') or f"CYBER-OFF-{str(user_id)[-4:].upper()}"
            officer_doc = {
                "user_id": user_id,
                "badge_number": badge_number,
                "rank": data.get('rank', 'Sub-Inspector'),
                "department": data.get('department', 'Cyber Crime Investigation Unit'),
                "specialization": data.get('specialization', ['Financial Fraud', 'Phishing']),
                "active_cases_count": 0,
                "resolved_cases_count": 0,
                "is_available": True,
                "created_at": datetime.now(timezone.utc)
            }
            db.officers.insert_one(officer_doc, session=session)
            officer_info = officer_doc

        return user_id, officer_info

    user_id, officer_info = run_transaction(_do_register)

    user_doc['_id'] = user_id
    if officer_info:
        user_doc['badge_number'] = officer_info.get('badge_number')
        user_doc['rank'] = officer_info.get('rank')
        user_doc['department'] = officer_info.get('department')
        user_doc['officer_id'] = officer_info.get('_id')

    log_audit("USER_REGISTER", "user", str(user_id), {"email": email, "role": role})

    # Welcome notification
    create_notification(
        user_id,
        "Welcome to Cyber Crime Portal",
        "Your account has been registered successfully. Keep your credentials secure.",
        "SYSTEM"
    )

    token = generate_jwt(user_doc)
    safe_user = serialize_doc(user_doc)
    safe_user.pop('password_hash', None)

    return {
        "token": token,
        "user": safe_user
    }

def login_user(email: str, password: str):
    db = get_db()
    email = email.strip().lower()
    user = db.users.find_one({"email": email})

    if not user:
        raise ValueError("Invalid email or password")

    if not user.get('is_active', True):
        raise ValueError("Your account is deactivated. Contact system administrator.")

    if not check_password(password, user['password_hash']):
        raise ValueError("Invalid email or password")

    # Update last login
    now = datetime.now(timezone.utc)
    db.users.update_one({"_id": user['_id']}, {"$set": {"last_login": now}})

    # If officer, retrieve officer record
    if user['role'] == 'officer':
        officer = db.officers.find_one({"user_id": user['_id']})
        if officer:
            user['badge_number'] = officer.get('badge_number')
            user['rank'] = officer.get('rank')
            user['department'] = officer.get('department')
            user['officer_id'] = officer.get('_id')
            user['specialization'] = officer.get('specialization', [])

    token = generate_jwt(user)

    log_audit("USER_LOGIN", "user", str(user['_id']), {"email": email, "role": user['role']})

    safe_user = serialize_doc(user)
    safe_user.pop('password_hash', None)

    return {
        "token": token,
        "user": safe_user
    }

def get_user_profile(user_id_str: str):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id_str)})
    if not user:
        return None
    
    if user.get('role') == 'officer':
        officer = db.officers.find_one({"user_id": user['_id']})
        if officer:
            user['officer_profile'] = serialize_doc(officer)
    
    safe_user = serialize_doc(user)
    safe_user.pop('password_hash', None)
    return safe_user
