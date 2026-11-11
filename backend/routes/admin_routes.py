import io
import csv
from datetime import datetime, timezone
from flask import Blueprint, request, Response
from bson import ObjectId
from backend.utils.db import get_db, serialize_docs, serialize_doc, run_transaction
from backend.middleware.auth_middleware import jwt_required, role_required
from backend.utils.helpers import api_response, error_response, hash_password
from backend.services.audit_service import log_audit

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/users', methods=['GET'])
@jwt_required
@role_required('admin')
def get_users():
    try:
        db = get_db()
        role = request.args.get('role')
        search = request.args.get('search', '').strip()
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))

        query = {}
        if role:
            query['role'] = role
        if search:
            query['$or'] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}}
            ]

        total = db.users.count_documents(query)
        cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
        users_list = list(cursor)

        return api_response({
            "users": serialize_docs(users_list),
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total,
                "total_pages": (total + limit - 1) // limit if limit > 0 else 1
            }
        }, "Users retrieved")
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/users/<user_id>/toggle-status', methods=['PUT'])
@jwt_required
@role_required('admin')
def toggle_user_status(user_id):
    try:
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return error_response("User not found", 404)

        new_status = not user.get('is_active', True)
        db.users.update_one({"_id": user['_id']}, {"$set": {"is_active": new_status}})

        log_audit(
            action="USER_STATUS_TOGGLED",
            target_entity="user",
            target_id=user_id,
            details={"email": user.get('email'), "new_status": new_status}
        )

        return api_response({"is_active": new_status}, f"User account is now {'active' if new_status else 'suspended'}")
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/officers', methods=['GET'])
@jwt_required
@role_required('admin')
def get_officers():
    try:
        db = get_db()
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user_info"
                }
            },
            {"$unwind": "$user_info"},
            {
                "$project": {
                    "_id": 1,
                    "user_id": 1,
                    "badge_number": 1,
                    "rank": 1,
                    "department": 1,
                    "specialization": 1,
                    "active_cases_count": 1,
                    "resolved_cases_count": 1,
                    "is_available": 1,
                    "name": "$user_info.full_name",
                    "email": "$user_info.email",
                    "phone": "$user_info.phone",
                    "is_active": "$user_info.is_active",
                    "created_at": 1
                }
            },
            {"$sort": {"active_cases_count": 1, "created_at": -1}}
        ]
        officers = list(db.officers.aggregate(pipeline))
        return api_response(serialize_docs(officers), "Officers retrieved")
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/officers', methods=['POST'])
@jwt_required
@role_required('admin')
def create_officer():
    try:
        db = get_db()
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        full_name = data.get('full_name', '').strip()
        password = data.get('password', 'Officer@123')
        badge_number = data.get('badge_number', '').strip().upper()
        rank = data.get('rank', 'Inspector')
        department = data.get('department', 'Cyber Investigation Cell')
        specialization = data.get('specialization', [])

        if not email or not full_name or not badge_number:
            return error_response("Email, Full Name, and Badge Number are required", 400)

        if db.users.find_one({"email": email}):
            return error_response("User with this email already exists", 400)
        if db.officers.find_one({"badge_number": badge_number}):
            return error_response("Badge number already assigned to another officer", 400)

        now = datetime.now(timezone.utc)
        user_doc = {
            "full_name": full_name,
            "email": email,
            "password_hash": hash_password(password),
            "phone": data.get('phone', ''),
            "role": "officer",
            "address": data.get('address', 'Cyber Crime Police Station'),
            "is_active": True,
            "created_at": now,
            "last_login": None
        }

        def _do_create(session=None):
            u_res = db.users.insert_one(user_doc, session=session)
            officer_doc = {
                "user_id": u_res.inserted_id,
                "badge_number": badge_number,
                "rank": rank,
                "department": department,
                "specialization": specialization if isinstance(specialization, list) else [specialization],
                "active_cases_count": 0,
                "resolved_cases_count": 0,
                "is_available": True,
                "created_at": now
            }
            o_res = db.officers.insert_one(officer_doc, session=session)
            return u_res.inserted_id, o_res.inserted_id

        user_id, officer_id = run_transaction(_do_create)

        log_audit(
            action="OFFICER_CREATED",
            target_entity="officer",
            target_id=str(officer_id),
            details={"badge_number": badge_number, "email": email}
        )

        return api_response({
            "user_id": str(user_id),
            "officer_id": str(officer_id),
            "badge_number": badge_number,
            "full_name": full_name
        }, "Officer profile registered successfully", 201)
    except Exception as e:
        return error_response(f"Officer registration failed: {str(e)}", 500)

@admin_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        db = get_db()
        cats = list(db.crime_categories.find({"is_active": True}).sort("name", 1))
        return api_response(serialize_docs(cats), "Crime categories retrieved")
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/categories', methods=['POST'])
@jwt_required
@role_required('admin')
def add_category():
    try:
        db = get_db()
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        default_severity = data.get('default_severity', 'Medium')
        sla_days = int(data.get('sla_days', 7))

        if not name:
            return error_response("Category name is required", 400)

        if db.crime_categories.find_one({"name": name}):
            return error_response("Category already exists", 400)

        cat_doc = {
            "name": name,
            "description": description,
            "default_severity": default_severity,
            "sla_days": sla_days,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        res = db.crime_categories.insert_one(cat_doc)
        cat_doc['_id'] = res.inserted_id

        log_audit("CATEGORY_CREATED", "category", str(res.inserted_id), {"name": name})

        return api_response(serialize_doc(cat_doc), "Category added successfully", 201)
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required
@role_required('admin')
def get_audit_logs():
    try:
        db = get_db()
        action = request.args.get('action')
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))

        query = {}
        if action:
            query['action'] = action

        total = db.audit_logs.count_documents(query)
        cursor = db.audit_logs.find(query).sort("timestamp", -1).skip((page - 1) * limit).limit(limit)
        logs = list(cursor)

        return api_response({
            "logs": serialize_docs(logs),
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total,
                "total_pages": (total + limit - 1) // limit if limit > 0 else 1
            }
        }, "Audit logs retrieved")
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/export/complaints', methods=['GET'])
@jwt_required
@role_required('admin')
def export_complaints_csv():
    try:
        db = get_db()
        cursor = db.complaints.find({}).sort("created_at", -1)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Complaint ID", "Citizen Name", "Citizen Email", "Category", 
            "Incident Date", "Incident Location", "Financial Loss (INR)", 
            "Priority", "Status", "Assigned Officer", "Officer Badge", 
            "Created Date", "Description"
        ])
        
        for c in cursor:
            writer.writerow([
                c.get('complaint_id', ''),
                c.get('citizen_name', ''),
                c.get('citizen_email', ''),
                c.get('category', ''),
                c.get('incident_date').strftime("%Y-%m-%d %H:%M") if c.get('incident_date') else '',
                c.get('incident_location', ''),
                c.get('financial_loss', 0.0),
                c.get('priority', ''),
                c.get('status', ''),
                c.get('assigned_officer_name', 'Unassigned'),
                c.get('assigned_officer_badge', ''),
                c.get('created_at').strftime("%Y-%m-%d %H:%M") if c.get('created_at') else '',
                c.get('description', '').replace('\n', ' ')
            ])
            
        csv_data = output.getvalue()
        output.close()
        
        log_audit("REPORT_EXPORT_COMPLAINTS", "report", "csv_export", {"timestamp": datetime.now(timezone.utc).isoformat()})
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=cybercrime_complaints_report_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"}
        )
    except Exception as e:
        return error_response(f"CSV export failed: {str(e)}", 500)

@admin_bp.route('/export/audit-logs', methods=['GET'])
@jwt_required
@role_required('admin')
def export_audit_logs_csv():
    try:
        db = get_db()
        cursor = db.audit_logs.find({}).sort("timestamp", -1).limit(1000)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(["Timestamp", "User Email", "Role", "Action", "Target Entity", "Target ID", "IP Address", "User Agent"])
        
        for log in cursor:
            writer.writerow([
                log.get('timestamp').strftime("%Y-%m-%d %H:%M:%S") if log.get('timestamp') else '',
                log.get('user_email', ''),
                log.get('user_role', ''),
                log.get('action', ''),
                log.get('target_entity', ''),
                log.get('target_id', ''),
                log.get('ip_address', ''),
                log.get('user_agent', '')
            ])
            
        csv_data = output.getvalue()
        output.close()
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=system_audit_logs_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"}
        )
    except Exception as e:
        return error_response(str(e), 500)
