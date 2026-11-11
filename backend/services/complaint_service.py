from datetime import datetime, timezone
import re
from bson import ObjectId
from backend.utils.db import get_db, serialize_doc, serialize_docs, run_transaction
from backend.utils.helpers import generate_complaint_id
from backend.services.audit_service import log_audit
from backend.services.notification_service import create_notification

def create_complaint(citizen_user: dict, data: dict):
    db = get_db()
    citizen_id = ObjectId(citizen_user['user_id'])
    
    category = data.get('category', 'Other Cyber Crimes').strip()
    incident_date_raw = data.get('incident_date')
    incident_time = data.get('incident_time', '')
    description = data.get('description', '').strip()
    
    if not description:
        raise ValueError("Complaint description is required")
    
    # Parse incident date
    if incident_date_raw:
        try:
            if isinstance(incident_date_raw, str):
                incident_date = datetime.fromisoformat(incident_date_raw.replace('Z', '+00:00'))
            else:
                incident_date = incident_date_raw
        except Exception:
            incident_date = datetime.now(timezone.utc)
    else:
        incident_date = datetime.now(timezone.utc)
    
    # Financial loss parsing
    financial_loss = 0.0
    try:
        if data.get('financial_loss'):
            financial_loss = float(data.get('financial_loss', 0.0))
    except (ValueError, TypeError):
        financial_loss = 0.0

    # Determine initial priority
    priority = data.get('priority', 'Medium')
    if financial_loss >= 500000:
        priority = "Critical"
    elif financial_loss >= 50000:
        priority = "High"

    complaint_id = generate_complaint_id()
    now = datetime.now(timezone.utc)

    # Initial investigation history event
    history_entry = {
        "stage": "SUBMISSION",
        "action": "Complaint Lodged",
        "status": "Submitted",
        "performed_by": citizen_id,
        "performed_by_name": citizen_user.get('full_name', 'Citizen'),
        "performed_by_role": "citizen",
        "notes": "Cybercrime complaint filed online via citizen portal.",
        "timestamp": now
    }

    complaint_doc = {
        "complaint_id": complaint_id,
        "citizen_id": citizen_id,
        "citizen_name": citizen_user.get('full_name', ''),
        "citizen_email": citizen_user.get('email', ''),
        "citizen_phone": citizen_user.get('phone', ''),
        "category": category,
        "incident_date": incident_date,
        "incident_time": incident_time,
        "incident_location": data.get('incident_location', 'Online / Virtual'),
        "description": description,
        "suspect_info": {
            "name": data.get('suspect_name', ''),
            "phone": data.get('suspect_phone', ''),
            "email": data.get('suspect_email', ''),
            "website_url": data.get('suspect_website', ''),
            "upi_id": data.get('suspect_upi', ''),
            "bank_account": data.get('suspect_bank_account', ''),
            "profile_url": data.get('suspect_profile_url', ''),
            "other_details": data.get('suspect_notes', '')
        },
        "financial_loss": financial_loss,
        "priority": priority,
        "status": "Submitted",
        "assigned_officer_id": None,
        "assigned_officer_name": None,
        "assigned_officer_badge": None,
        "evidence_ids": [],
        "rejection_reason": None,
        "resolution_summary": None,
        "investigation_history": [history_entry],
        "created_at": now,
        "updated_at": now
    }

    result = db.complaints.insert_one(complaint_doc)
    doc_id = result.inserted_id
    complaint_doc['_id'] = doc_id

    # Log audit
    log_audit("COMPLAINT_CREATED", "complaint", str(doc_id), {
        "complaint_id": complaint_id,
        "category": category,
        "financial_loss": financial_loss,
        "priority": priority
    })

    # Notify Citizen
    create_notification(
        citizen_id,
        "Complaint Lodged Successfully",
        f"Your cybercrime complaint has been registered with ID: {complaint_id}. Our investigation team will review it shortly.",
        "STATUS_UPDATE",
        complaint_id
    )

    return serialize_doc(complaint_doc)

def get_complaints(query_params: dict, user: dict):
    db = get_db()
    query = {}
    
    user_role = user.get('role')
    user_id = ObjectId(user.get('user_id'))
    
    # Scoping by role
    if user_role == 'citizen':
        query['citizen_id'] = user_id
    elif user_role == 'officer':
        # Officer can request my assigned cases or filter
        scope = query_params.get('scope', 'all')
        if scope == 'my':
            # find officer record
            officer = db.officers.find_one({"user_id": user_id})
            if officer:
                query['assigned_officer_id'] = officer['_id']
            else:
                query['assigned_officer_id'] = user_id

    # Category filter
    if query_params.get('category'):
        query['category'] = query_params.get('category')
        
    # Status filter
    if query_params.get('status'):
        query['status'] = query_params.get('status')
        
    # Priority filter
    if query_params.get('priority'):
        query['priority'] = query_params.get('priority')
        
    # Search filter (by complaint_id or text match)
    search_term = query_params.get('search', '').strip()
    if search_term:
        regex = re.compile(re.escape(search_term), re.IGNORECASE)
        query['$or'] = [
            {"complaint_id": regex},
            {"description": regex},
            {"category": regex},
            {"incident_location": regex},
            {"citizen_name": regex},
            {"suspect_info.name": regex},
            {"suspect_info.phone": regex},
            {"suspect_info.upi_id": regex}
        ]

    # Date range filters
    date_from = query_params.get('date_from')
    date_to = query_params.get('date_to')
    if date_from or date_to:
        query['created_at'] = {}
        if date_from:
            try:
                query['created_at']['$gte'] = datetime.fromisoformat(date_from)
            except Exception:
                pass
        if date_to:
            try:
                query['created_at']['$lte'] = datetime.fromisoformat(date_to)
            except Exception:
                pass
        if not query['created_at']:
            query.pop('created_at', None)

    # Pagination
    try:
        page = max(1, int(query_params.get('page', 1)))
        limit = min(100, max(1, int(query_params.get('limit', 10))))
    except ValueError:
        page, limit = 1, 10
    
    skip = (page - 1) * limit
    total_count = db.complaints.count_documents(query)
    
    sort_field = query_params.get('sort_by', 'created_at')
    sort_dir = -1 if query_params.get('order', 'desc').lower() == 'desc' else 1
    
    cursor = db.complaints.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    complaints = list(cursor)
    
    total_pages = (total_count + limit - 1) // limit if limit > 0 else 1

    return {
        "complaints": serialize_docs(complaints),
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages
        }
    }

def get_complaint_by_id(identifier: str, user: dict):
    db = get_db()
    query = {}
    if ObjectId.is_valid(identifier):
        query = {"$or": [{"_id": ObjectId(identifier)}, {"complaint_id": identifier}]}
    else:
        query = {"complaint_id": identifier}
    
    complaint = db.complaints.find_one(query)
    if not complaint:
        return None
    
    # Permission check for citizen
    if user.get('role') == 'citizen':
        if str(complaint['citizen_id']) != user.get('user_id'):
            raise PermissionError("Access denied: You can only view your own complaints.")

    # Retrieve associated evidence records
    evidence_list = list(db.evidence.find({"complaint_id": complaint['_id']}).sort("created_at", -1))
    complaint['evidence_details'] = serialize_docs(evidence_list)

    # Retrieve investigation notes
    notes_list = list(db.investigations.find({"complaint_id": complaint['_id']}).sort("created_at", -1))
    complaint['investigation_notes'] = serialize_docs(notes_list)

    return serialize_doc(complaint)

def assign_complaint(complaint_id_str: str, officer_id_str: str, admin_user: dict, priority: str = None, notes: str = ""):
    db = get_db()
    
    # Validate complaint
    complaint = db.complaints.find_one({"_id": ObjectId(complaint_id_str)})
    if not complaint:
        raise ValueError("Complaint not found")
    
    # Validate officer
    officer = db.officers.find_one({"_id": ObjectId(officer_id_str)})
    if not officer:
        # Check if officer_id is user_id
        officer = db.officers.find_one({"user_id": ObjectId(officer_id_str)})
    if not officer:
        raise ValueError("Officer not found")
    
    officer_user = db.users.find_one({"_id": officer['user_id']})
    officer_name = officer_user.get('full_name', 'Investigation Officer') if officer_user else 'Officer'
    officer_badge = officer.get('badge_number', 'CYBER-OFF')

    now = datetime.now(timezone.utc)
    new_priority = priority or complaint.get('priority', 'Medium')

    history_entry = {
        "stage": "ASSIGNMENT",
        "action": f"Assigned to {officer_name} ({officer_badge})",
        "status": "Assigned",
        "performed_by": ObjectId(admin_user['user_id']),
        "performed_by_name": admin_user.get('full_name', 'Administrator'),
        "performed_by_role": "admin",
        "notes": notes or f"Case assigned for detailed investigation and evidence analysis.",
        "timestamp": now
    }

    def _do_assign(session=None):
        # Update complaint
        db.complaints.update_one(
            {"_id": complaint['_id']},
            {
                "$set": {
                    "assigned_officer_id": officer['_id'],
                    "assigned_officer_name": officer_name,
                    "assigned_officer_badge": officer_badge,
                    "status": "Assigned",
                    "priority": new_priority,
                    "updated_at": now
                },
                "$push": {"investigation_history": history_entry}
            },
            session=session
        )

        # Increment active cases for officer
        db.officers.update_one(
            {"_id": officer['_id']},
            {"$inc": {"active_cases_count": 1}},
            session=session
        )

    run_transaction(_do_assign)

    # Notify officer
    create_notification(
        officer['user_id'],
        "New Case Assigned",
        f"Case {complaint['complaint_id']} ({complaint['category']}) has been assigned to you for investigation.",
        "OFFICER_ASSIGNED",
        complaint['complaint_id']
    )

    # Notify citizen
    create_notification(
        complaint['citizen_id'],
        "Case Assigned to Officer",
        f"Your complaint {complaint['complaint_id']} has been assigned to Officer {officer_name} ({officer_badge}).",
        "STATUS_UPDATE",
        complaint['complaint_id']
    )

    log_audit("OFFICER_ASSIGNED", "complaint", str(complaint['_id']), {
        "complaint_id": complaint['complaint_id'],
        "officer_name": officer_name,
        "officer_badge": officer_badge
    })

    return get_complaint_by_id(str(complaint['_id']), admin_user)

def update_investigation_status(complaint_id_str: str, officer_user: dict, new_status: str, notes: str = "", resolution_summary: str = None, rejection_reason: str = None, priority: str = None):
    db = get_db()
    complaint = db.complaints.find_one({"_id": ObjectId(complaint_id_str)})
    if not complaint:
        raise ValueError("Complaint not found")
    
    valid_statuses = ["Under Review", "Assigned", "Investigation in Progress", "Resolved", "Rejected", "Closed"]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status: {new_status}. Allowed: {', '.join(valid_statuses)}")

    now = datetime.now(timezone.utc)
    old_status = complaint.get('status')

    history_entry = {
        "stage": "STATUS_UPDATE",
        "action": f"Status changed to {new_status}",
        "status": new_status,
        "performed_by": ObjectId(officer_user['user_id']),
        "performed_by_name": officer_user.get('full_name', 'Officer'),
        "performed_by_role": officer_user.get('role', 'officer'),
        "notes": notes or f"Investigation status transitioned from {old_status} to {new_status}.",
        "timestamp": now
    }

    update_fields = {
        "status": new_status,
        "updated_at": now
    }
    if priority:
        update_fields["priority"] = priority
    if resolution_summary:
        update_fields["resolution_summary"] = resolution_summary
    if rejection_reason:
        update_fields["rejection_reason"] = rejection_reason

    def _do_update(session=None):
        db.complaints.update_one(
            {"_id": complaint['_id']},
            {
                "$set": update_fields,
                "$push": {"investigation_history": history_entry}
            },
            session=session
        )

        # If status moved to Resolved or Closed from active, adjust officer counters
        if new_status in ["Resolved", "Closed"] and old_status not in ["Resolved", "Closed"]:
            if complaint.get('assigned_officer_id'):
                db.officers.update_one(
                    {"_id": complaint['assigned_officer_id']},
                    {
                        "$inc": {"active_cases_count": -1, "resolved_cases_count": 1}
                    },
                    session=session
                )
        elif old_status in ["Resolved", "Closed"] and new_status not in ["Resolved", "Closed"]:
            if complaint.get('assigned_officer_id'):
                db.officers.update_one(
                    {"_id": complaint['assigned_officer_id']},
                    {
                        "$inc": {"active_cases_count": 1, "resolved_cases_count": -1}
                    },
                    session=session
                )

    run_transaction(_do_update)

    # Notify Citizen
    msg = f"Your complaint {complaint['complaint_id']} status is now: {new_status}."
    if resolution_summary:
        msg += f" Resolution: {resolution_summary}"
    elif rejection_reason:
        msg += f" Reason: {rejection_reason}"
        
    create_notification(
        complaint['citizen_id'],
        f"Complaint Status: {new_status}",
        msg,
        "STATUS_UPDATE",
        complaint['complaint_id']
    )

    log_audit("STATUS_UPDATED", "complaint", str(complaint['_id']), {
        "complaint_id": complaint['complaint_id'],
        "old_status": old_status,
        "new_status": new_status,
        "notes": notes
    })

    return get_complaint_by_id(str(complaint['_id']), officer_user)

def add_investigation_log(complaint_id_str: str, officer_user: dict, data: dict):
    db = get_db()
    complaint = db.complaints.find_one({"_id": ObjectId(complaint_id_str)})
    if not complaint:
        raise ValueError("Complaint not found")

    title = data.get('title', 'Forensic Analysis Entry').strip()
    activity_type = data.get('activity_type', 'EVIDENCE_ANALYSIS')
    details = data.get('details', '').strip()
    findings = data.get('findings', '').strip()
    action_taken = data.get('action_taken', '').strip()
    next_steps = data.get('next_steps', '').strip()

    now = datetime.now(timezone.utc)

    investigation_doc = {
        "complaint_id": complaint['_id'],
        "complaint_number": complaint['complaint_id'],
        "officer_user_id": ObjectId(officer_user['user_id']),
        "officer_name": officer_user.get('full_name', 'Officer'),
        "officer_badge": officer_user.get('badge_number', 'CYBER-OFF'),
        "activity_type": activity_type,
        "title": title,
        "details": details,
        "findings": findings,
        "action_taken": action_taken,
        "next_steps": next_steps,
        "created_at": now
    }

    res = db.investigations.insert_one(investigation_doc)

    # Also record in complaint history
    history_entry = {
        "stage": "INVESTIGATION_NOTE",
        "action": f"{activity_type}: {title}",
        "status": complaint.get('status'),
        "performed_by": ObjectId(officer_user['user_id']),
        "performed_by_name": officer_user.get('full_name', 'Officer'),
        "performed_by_role": "officer",
        "notes": f"Findings: {findings}. Action taken: {action_taken}",
        "timestamp": now
    }

    db.complaints.update_one(
        {"_id": complaint['_id']},
        {
            "$push": {"investigation_history": history_entry},
            "$set": {"updated_at": now}
        }
    )

    log_audit("INVESTIGATION_NOTE_ADDED", "investigation", str(res.inserted_id), {
        "complaint_id": complaint['complaint_id'],
        "title": title,
        "activity_type": activity_type
    })

    investigation_doc['_id'] = res.inserted_id
    return serialize_doc(investigation_doc)
