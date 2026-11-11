import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.utils.db import get_db

USER_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["full_name", "email", "password_hash", "role"],
        "properties": {
            "full_name": {
                "bsonType": "string",
                "description": "Citizen or Officer full name is required"
            },
            "email": {
                "bsonType": "string",
                "pattern": "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
                "description": "Valid email address is required"
            },
            "password_hash": {
                "bsonType": "string",
                "description": "Secure bcrypt password hash required"
            },
            "role": {
                "enum": ["citizen", "officer", "admin"],
                "description": "Must be citizen, officer, or admin"
            },
            "phone": {"bsonType": "string"},
            "address": {"bsonType": "string"},
            "is_active": {"bsonType": "bool"}
        }
    }
}

COMPLAINT_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["complaint_id", "citizen_id", "category", "description", "status"],
        "properties": {
            "complaint_id": {
                "bsonType": "string",
                "description": "Unique complaint reference ID required"
            },
            "citizen_id": {
                "bsonType": "objectId",
                "description": "Reference to user document required"
            },
            "category": {
                "bsonType": "string",
                "description": "Crime category is required"
            },
            "description": {
                "bsonType": "string",
                "description": "Detailed incident description required"
            },
            "financial_loss": {
                "bsonType": ["double", "int", "long"],
                "description": "Reported monetary loss"
            },
            "priority": {
                "enum": ["Low", "Medium", "High", "Critical"],
                "description": "Priority level"
            },
            "status": {
                "enum": ["Submitted", "Under Review", "Assigned", "Investigation in Progress", "Resolved", "Rejected", "Closed"],
                "description": "Current lifecycle state"
            }
        }
    }
}

OFFICER_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["user_id", "badge_number", "rank", "department"],
        "properties": {
            "user_id": {
                "bsonType": "objectId",
                "description": "Reference to users collection required"
            },
            "badge_number": {
                "bsonType": "string",
                "description": "Unique departmental badge number required"
            },
            "rank": {"bsonType": "string"},
            "department": {"bsonType": "string"}
        }
    }
}

CRIME_CATEGORY_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name"],
        "properties": {
            "name": {
                "bsonType": "string",
                "description": "Unique cybercrime category name required"
            },
            "default_severity": {
                "enum": ["Low", "Medium", "High", "Critical"]
            }
        }
    }
}

def apply_validators(db=None):
    """
    Applies JSON Schema validators to MongoDB collections.
    """
    if db is None:
        db = get_db()
    
    validators = {
        "users": USER_VALIDATOR,
        "complaints": COMPLAINT_VALIDATOR,
        "officers": OFFICER_VALIDATOR,
        "crime_categories": CRIME_CATEGORY_VALIDATOR
    }

    existing_collections = db.list_collection_names()
    print("Applying MongoDB Schema Validators...")

    for coll_name, schema in validators.items():
        try:
            if coll_name in existing_collections:
                db.command({
                    "collMod": coll_name,
                    "validator": schema,
                    "validationLevel": "moderate",
                    "validationAction": "warn"
                })
                print(f"  [OK] Updated validator on existing collection: {coll_name}")
            else:
                db.create_collection(
                    coll_name,
                    validator=schema,
                    validationLevel="moderate",
                    validationAction="warn"
                )
                print(f"  [OK] Created collection with validator: {coll_name}")
        except Exception as e:
            print(f"  [WARN] Notice applying validator to {coll_name}: {e}")

if __name__ == '__main__':
    apply_validators()
    print("Schema validators applied successfully.")
