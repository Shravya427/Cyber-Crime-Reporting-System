from functools import wraps
from flask import request
import jwt
from backend.utils.helpers import decode_jwt, error_response
from backend.utils.db import get_db
from bson import ObjectId

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response("Authorization header missing", 401)
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return error_response("Invalid token format. Format: Bearer <token>", 401)
        
        token = parts[1]
        try:
            payload = decode_jwt(token)
            # Fetch user to ensure user still exists and is active
            db = get_db()
            user = db.users.find_one({"_id": ObjectId(payload['user_id'])})
            if not user or not user.get('is_active', True):
                return error_response("User account is inactive or not found", 401)
            
            # Attach user info to request
            request.user = payload
            request.user_doc = user
        except jwt.ExpiredSignatureError:
            return error_response("Token has expired. Please log in again.", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid token. Please authenticate.", 401)
        except Exception as e:
            return error_response(f"Authentication error: {str(e)}", 401)
        
        return f(*args, **kwargs)
    return decorated_function

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'user') or not request.user:
                return error_response("Authentication required", 401)
            
            user_role = request.user.get('role')
            if user_role not in allowed_roles:
                return error_response(f"Access denied. Requires role: {', '.join(allowed_roles)}", 403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
