import logging
from datetime import datetime, date
from bson import ObjectId
from pymongo import MongoClient
import gridfs
from backend.config import Config

logger = logging.getLogger(__name__)

_client = None
_db = None
_fs = None
_is_replica_set = None

def get_client():
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client

def get_db():
    global _db
    if _db is None:
        client = get_client()
        _db = client[Config.MONGO_DB_NAME]
    return _db

def get_gridfs():
    global _fs
    if _fs is None:
        db = get_db()
        _fs = gridfs.GridFS(db)
    return _fs

def check_replica_set():
    global _is_replica_set
    if _is_replica_set is None:
        try:
            client = get_client()
            status = client.admin.command('replSetGetStatus')
            _is_replica_set = True
        except Exception:
            _is_replica_set = False
    return _is_replica_set

def run_transaction(callback, *args, **kwargs):
    """
    Executes a callback inside a MongoDB transaction if replica set is available,
    otherwise executes directly for standalone instances.
    """
    client = get_client()
    if check_replica_set():
        with client.start_session() as session:
            with session.start_transaction():
                return callback(session=session, *args, **kwargs)
    else:
        # Standalone local dev instance
        return callback(session=None, *args, **kwargs)

def serialize_doc(doc):
    """Converts MongoDB BSON document into JSON serializable dict."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if not isinstance(doc, dict):
        if isinstance(doc, ObjectId):
            return str(doc)
        if isinstance(doc, (datetime, date)):
            return doc.isoformat()
        return doc

    res = {}
    for key, val in doc.items():
        if isinstance(val, ObjectId):
            res[key] = str(val)
        elif isinstance(val, (datetime, date)):
            res[key] = val.isoformat()
        elif isinstance(val, dict):
            res[key] = serialize_doc(val)
        elif isinstance(val, list):
            res[key] = [serialize_doc(item) for item in val]
        elif isinstance(val, bytes):
            res[key] = val.hex()
        else:
            res[key] = val
    return res

def serialize_docs(docs):
    return [serialize_doc(d) for d in docs]
