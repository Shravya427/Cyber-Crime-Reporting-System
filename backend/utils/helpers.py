import re
import hashlib
import random
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from flask import jsonify
from backend.config import Config

def hash_password(password: str) -> str:
    """Hashes a plain password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_jwt(user_data: dict) -> str:
    """Generates a signed JWT token."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': str(user_data['_id']),
        'email': user_data['email'],
        'role': user_data['role'],
        'full_name': user_data.get('full_name', ''),
        'officer_id': str(user_data.get('officer_id', '')) if user_data.get('officer_id') else None,
        'badge_number': user_data.get('badge_number', ''),
        'iat': now,
        'exp': now + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def decode_jwt(token: str) -> dict:
    """Decodes and validates a JWT token."""
    return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])

def generate_complaint_id() -> str:
    """
    Generates a unique complaint ID in format: CC-YYYYMM-XXXX
    e.g., CC-202611-8492
    """
    now = datetime.now()
    year_month = now.strftime("%Y%m")
    random_digits = random.randint(1000, 9999)
    return f"CC-{year_month}-{random_digits}"

def calculate_sha256(file_stream) -> str:
    """Computes SHA-256 hash of a file for digital evidence chain of custody."""
    sha256 = hashlib.sha256()
    file_stream.seek(0)
    while chunk := file_stream.read(8192):
        sha256.update(chunk)
    file_stream.seek(0)
    return sha256.hexdigest()

def is_allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def api_response(data=None, message="Success", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status_code

def error_response(message="An error occurred", status_code=400, details=None):
    res = {
        "success": False,
        "error": message
    }
    if details:
        res["details"] = details
    return jsonify(res), status_code
