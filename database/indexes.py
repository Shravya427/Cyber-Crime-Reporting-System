import sys
from pathlib import Path
from pymongo import ASCENDING, DESCENDING, TEXT

project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.utils.db import get_db

def create_indexes(db=None):
    """
    Creates compound, unique, and full-text indexes across MongoDB collections
    to optimize aggregation pipelines, queries, and enforce integrity.
    """
    if db is None:
        db = get_db()
    
    print("Creating MongoDB Indexes...")

    # 1. USERS COLLECTION INDEXES
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
    db.users.create_index([("role", ASCENDING), ("is_active", ASCENDING)], name="idx_users_role_status")
    print("  [OK] Users indexes created (Unique email, role-status)")

    # 2. OFFICERS COLLECTION INDEXES
    db.officers.create_index([("badge_number", ASCENDING)], unique=True, name="idx_officers_badge_unique")
    db.officers.create_index([("user_id", ASCENDING)], unique=True, name="idx_officers_userid_unique")
    db.officers.create_index([("active_cases_count", ASCENDING)], name="idx_officers_workload")
    print("  [OK] Officers indexes created (Unique badge, Unique user_id, workload)")

    # 3. CRIME CATEGORIES INDEXES
    db.crime_categories.create_index([("name", ASCENDING)], unique=True, name="idx_categories_name_unique")
    print("  [OK] Crime categories unique index created")

    # 4. COMPLAINTS COLLECTION INDEXES (Compound, Unique, Text)
    # Unique index on complaint_id
    db.complaints.create_index([("complaint_id", ASCENDING)], unique=True, name="idx_complaints_id_unique")
    
    # Compound indexes for status & timeline sorting
    db.complaints.create_index([("status", ASCENDING), ("created_at", DESCENDING)], name="idx_complaints_status_date_compound")
    db.complaints.create_index([("category", ASCENDING), ("status", ASCENDING)], name="idx_complaints_cat_status_compound")
    db.complaints.create_index([("assigned_officer_id", ASCENDING), ("status", ASCENDING)], name="idx_complaints_officer_status_compound")
    db.complaints.create_index([("citizen_id", ASCENDING), ("created_at", DESCENDING)], name="idx_complaints_citizen_date_compound")
    db.complaints.create_index([("priority", ASCENDING), ("status", ASCENDING)], name="idx_complaints_priority_status")

    # Full-Text Search Index on description, complaint_id, and location
    db.complaints.create_index(
        [
            ("description", TEXT),
            ("complaint_id", TEXT),
            ("incident_location", TEXT),
            ("citizen_name", TEXT)
        ],
        name="idx_complaints_fulltext",
        weights={"complaint_id": 10, "description": 5, "citizen_name": 3, "incident_location": 2}
    )
    print("  [OK] Complaints indexes created (Compound status+date, officer+status, citizen+date, Full-Text search)")

    # 5. EVIDENCE COLLECTION INDEXES
    db.evidence.create_index([("complaint_id", ASCENDING), ("created_at", DESCENDING)], name="idx_evidence_complaint_date")
    db.evidence.create_index([("file_id", ASCENDING)], name="idx_evidence_file_id")
    print("  [OK] Evidence indexes created (complaint_id, file_id)")

    # 6. INVESTIGATIONS COLLECTION INDEXES
    db.investigations.create_index([("complaint_id", ASCENDING), ("created_at", DESCENDING)], name="idx_investigations_complaint_date")
    db.investigations.create_index([("officer_user_id", ASCENDING)], name="idx_investigations_officer")
    print("  [OK] Investigations indexes created")

    # 7. NOTIFICATIONS COLLECTION INDEXES
    db.notifications.create_index([("recipient_id", ASCENDING), ("is_read", ASCENDING), ("created_at", DESCENDING)], name="idx_notifications_user_unread")
    print("  [OK] Notifications compound index created")

    # 8. AUDIT LOGS COLLECTION INDEXES
    db.audit_logs.create_index([("timestamp", DESCENDING)], name="idx_audit_logs_timestamp")
    db.audit_logs.create_index([("action", ASCENDING), ("timestamp", DESCENDING)], name="idx_audit_logs_action_timestamp")
    print("  [OK] Audit logs indexes created")

if __name__ == '__main__':
    create_indexes()
    print("All MongoDB indexes established successfully.")
