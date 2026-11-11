from flask import Blueprint, request
from backend.services.auth_service import register_user, login_user, get_user_profile
from backend.middleware.auth_middleware import jwt_required
from backend.utils.helpers import api_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        result = register_user(data)
        return api_response(result, "Account created successfully", 201)
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Registration failed: {str(e)}", 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '')
        password = data.get('password', '')
        if not email or not password:
            return error_response("Email and password are required", 400)
        
        result = login_user(email, password)
        return api_response(result, "Logged in successfully")
    except ValueError as e:
        return error_response(str(e), 401)
    except Exception as e:
        return error_response(f"Login failed: {str(e)}", 500)

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_current_user():
    try:
        profile = get_user_profile(request.user['user_id'])
        if not profile:
            return error_response("User not found", 404)
        return api_response(profile, "User profile retrieved")
    except Exception as e:
        return error_response(str(e), 500)
