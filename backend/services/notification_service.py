from datetime import datetime, timezone
from bson import ObjectId
from backend.utils.db import get_db, serialize_docs

def create_notification(recipient_id, title: str, message: str, notif_type: str = "STATUS_UPDATE", complaint_id: str = None):
    """
    Inserts a notification record for a citizen or officer.
    """
    db = get_db()
    notif = {
        "recipient_id": ObjectId(recipient_id) if isinstance(recipient_id, str) else recipient_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "complaint_id": str(complaint_id) if complaint_id else None,
        "is_read": False,
        "created_at": datetime.now(timezone.utc)
    }
    result = db.notifications.insert_one(notif)
    return str(result.inserted_id)

def get_user_notifications(user_id, unread_only=False, limit=50):
    db = get_db()
    query = {"recipient_id": ObjectId(user_id)}
    if unread_only:
        query["is_read"] = False
    
    cursor = db.notifications.find(query).sort("created_at", -1).limit(limit)
    return serialize_docs(list(cursor))

def mark_as_read(notif_id: str, user_id: str):
    db = get_db()
    result = db.notifications.update_one(
        {"_id": ObjectId(notif_id), "recipient_id": ObjectId(user_id)},
        {"$set": {"is_read": True}}
    )
    return result.modified_count > 0

def mark_all_as_read(user_id: str):
    db = get_db()
    result = db.notifications.update_many(
        {"recipient_id": ObjectId(user_id), "is_read": False},
        {"$set": {"is_read": True}}
    )
    return result.modified_count
