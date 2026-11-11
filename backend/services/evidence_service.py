from datetime import datetime, timezone
from io import BytesIO
from bson import ObjectId
from werkzeug.utils import secure_filename
from backend.utils.db import get_db, get_gridfs, serialize_doc, serialize_docs
from backend.utils.helpers import calculate_sha256, is_allowed_file
from backend.services.audit_service import log_audit

def upload_evidence_file(file_obj, complaint_id_str: str, uploaded_by_id_str: str, evidence_type: str = "Screenshot", description: str = ""):
    """
    Stores an evidence file in MongoDB GridFS and creates an evidence catalog record.
    Also calculates SHA-256 for cryptographic integrity and updates the complaint.
    """
    if not file_obj or file_obj.filename == '':
        raise ValueError("No file provided")
    
    if not is_allowed_file(file_obj.filename):
        raise ValueError("Unsupported file extension. Allowed: png, jpg, jpeg, webp, pdf, txt, csv")
    
    original_filename = secure_filename(file_obj.filename)
    content_type = file_obj.content_type or 'application/octet-stream'
    
    # Read file data to calculate SHA256 and store in GridFS
    file_bytes = file_obj.read()
    file_size = len(file_bytes)
    sha256_hash = calculate_sha256(BytesIO(file_bytes))
    
    fs = get_gridfs()
    gridfs_file_id = fs.put(
        file_bytes,
        filename=original_filename,
        content_type=content_type,
        sha256=sha256_hash,
        metadata={
            "complaint_id": complaint_id_str,
            "uploaded_by": uploaded_by_id_str,
            "evidence_type": evidence_type
        }
    )
    
    db = get_db()
    evidence_doc = {
        "complaint_id": ObjectId(complaint_id_str),
        "file_id": gridfs_file_id,
        "filename": f"{gridfs_file_id}_{original_filename}",
        "original_name": original_filename,
        "content_type": content_type,
        "file_size": file_size,
        "evidence_type": evidence_type or "Screenshot",
        "description": description or "",
        "uploaded_by": ObjectId(uploaded_by_id_str),
        "sha256_hash": sha256_hash,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = db.evidence.insert_one(evidence_doc)
    evidence_id = result.inserted_id
    
    # Push to complaint's evidence_ids list
    db.complaints.update_one(
        {"_id": ObjectId(complaint_id_str)},
        {"$addToSet": {"evidence_ids": evidence_id}}
    )
    
    log_audit(
        action="EVIDENCE_UPLOADED",
        target_entity="evidence",
        target_id=str(evidence_id),
        details={
            "complaint_id": complaint_id_str,
            "original_name": original_filename,
            "file_size": file_size,
            "sha256_hash": sha256_hash
        }
    )
    
    evidence_doc["_id"] = evidence_id
    return serialize_doc(evidence_doc)

def get_evidence_file_stream(evidence_id_str: str):
    """
    Retrieves evidence metadata and binary stream from GridFS.
    """
    db = get_db()
    fs = get_gridfs()
    
    evidence_doc = db.evidence.find_one({"_id": ObjectId(evidence_id_str)})
    if not evidence_doc:
        return None, None
    
    gridfs_file = fs.get(evidence_doc['file_id'])
    return evidence_doc, gridfs_file

def list_evidence_for_complaint(complaint_id_str: str):
    db = get_db()
    cursor = db.evidence.find({"complaint_id": ObjectId(complaint_id_str)}).sort("created_at", -1)
    return serialize_docs(list(cursor))
