# Advanced MongoDB Database Design & Architecture
## Cyber Crime Reporting and Investigation Management System

This document outlines the database design, collection schemas, relationship models, indexing strategies, schema validators, aggregation pipelines, and GridFS architecture for the **Cyber Crime Reporting and Investigation Management System**.

---

## 1. Database Overview

- **Database Engine**: MongoDB Atlas / MongoDB Enterprise Server 8.x
- **Driver**: PyMongo 4.x
- **Database Name**: `cyber_crime_reporting_db`
- **Data Modeling Paradigm**: Hybrid Document Model combining **Referencing** (for relational entities like Users and Officers) with **Embedding** (for high-velocity lifecycle timeline entries like `investigation_history` and `suspect_info`).

---

## 2. Collections & Schema Architecture

The system utilizes **8 core collections** plus **2 GridFS system collections**:

```
cyber_crime_reporting_db/
├── users               (Authentication, profiles, roles: Citizen, Officer, Admin)
├── officers            (Police badges, ranks, departments, workload metrics)
├── crime_categories    (Validated cybercrime categories with SLAs)
├── complaints          (Master incident records with embedded timelines)
├── evidence            (Forensic evidence metadata with GridFS pointers)
├── investigations      (In-depth forensic inquiry logs and field actions)
├── notifications       (Real-time in-app user & officer alerts)
├── audit_logs          (Tamper-evident administrative & security activity trail)
├── fs.files            (MongoDB GridFS binary file metadata)
└── fs.chunks           (MongoDB GridFS 255KB binary chunks)
```

---

### Collection 1: `users`
Stores identity and authentication credentials for all actors.

```json
{
  "_id": ObjectId("6724b0f1..."),
  "full_name": "Dr. Rajeshwar Sen",
  "email": "admin@cybercell.gov.in",
  "password_hash": "$2b$12$e8xL...",
  "phone": "+91 98110 01100",
  "role": "admin",
  "address": "State Cyber Command Center, Tower B, Sector 62",
  "id_proof_type": "Aadhaar",
  "id_proof_number": "XXXX-XXXX-8921",
  "is_active": true,
  "created_at": ISODate("2026-09-01T10:00:00Z"),
  "last_login": ISODate("2026-11-01T08:15:00Z")
}
```

---

### Collection 2: `officers`
Stores departmental attributes and live workload metrics for investigation personnel. Referenced from `users._id`.

```json
{
  "_id": ObjectId("6724b0f2..."),
  "user_id": ObjectId("6724b0f1..."),
  "badge_number": "CYBER-OFF-001",
  "rank": "Inspector",
  "department": "Financial Cyber Fraud Wing",
  "specialization": ["UPI Fraud", "Online Financial Fraud", "Phishing"],
  "active_cases_count": 2,
  "resolved_cases_count": 5,
  "is_available": true,
  "created_at": ISODate("2026-09-15T09:30:00Z")
}
```

---

### Collection 3: `crime_categories`
Master collection of classified cyber offences.

```json
{
  "_id": ObjectId("6724b0f3..."),
  "name": "UPI Fraud",
  "description": "QR code scanning traps, fraudulent collect requests, fake cashback links...",
  "default_severity": "Critical",
  "sla_days": 1,
  "is_active": true,
  "created_at": ISODate("2026-09-01T00:00:00Z")
}
```

---

### Collection 4: `complaints`
The central operational document. Uses an embedded model for `investigation_history` and `suspect_info` to ensure high read performance and single-document query atomicity.

```json
{
  "_id": ObjectId("6724b0f4..."),
  "complaint_id": "CC-202610-8491",
  "citizen_id": ObjectId("6724b0e5..."),
  "citizen_name": "Rahul Mehta",
  "citizen_email": "rahul.mehta@gmail.com",
  "citizen_phone": "+91 99100 23456",
  "category": "UPI Fraud",
  "incident_date": ISODate("2026-10-26T14:35:00Z"),
  "incident_time": "14:35 IST",
  "incident_location": "Bengaluru (Online / Google Pay)",
  "description": "Received automated SMS regarding electricity bill disconnection...",
  "suspect_info": {
    "name": "Ramesh Kumar (Impersonating Support)",
    "phone": "+91 98765 43210",
    "upi_id": "fastcashback.verify@ybl",
    "bank_account": "Kotak Mahindra Bank - 89230192841",
    "website_url": "http://bescom-bill-update-desk.com",
    "other_details": "Claimed to be officer in IT dept."
  },
  "financial_loss": 85000.0,
  "priority": "Critical",
  "status": "Investigation in Progress",
  "assigned_officer_id": ObjectId("6724b0f2..."),
  "assigned_officer_name": "Inspector Vikrant Sharma",
  "assigned_officer_badge": "CYBER-OFF-001",
  "evidence_ids": [ObjectId("6724b0e9...")],
  "rejection_reason": null,
  "resolution_summary": null,
  "investigation_history": [
    {
      "stage": "SUBMISSION",
      "action": "Complaint Lodged",
      "status": "Submitted",
      "performed_by": ObjectId("6724b0e5..."),
      "performed_by_name": "Rahul Mehta",
      "performed_by_role": "citizen",
      "notes": "Citizen lodged complaint with UPI transaction logs.",
      "timestamp": ISODate("2026-10-26T14:35:00Z")
    },
    {
      "stage": "ASSIGNMENT",
      "action": "Assigned to Inspector Vikrant Sharma (CYBER-OFF-001)",
      "status": "Assigned",
      "performed_by": ObjectId("6724b0f1..."),
      "performed_by_name": "Dr. Rajeshwar Sen",
      "performed_by_role": "admin",
      "notes": "High financial loss. Assigned to Financial Cyber Fraud Wing for bank freeze notice.",
      "timestamp": ISODate("2026-10-27T08:35:00Z")
    }
  ],
  "created_at": ISODate("2026-10-26T14:35:00Z"),
  "updated_at": ISODate("2026-10-28T10:00:00Z")
}
```

---

### Collection 5: `evidence` & GridFS
Tracks digital evidence items stored inside MongoDB GridFS (`fs.files` and `fs.chunks`).

```json
{
  "_id": ObjectId("6724b0e9..."),
  "complaint_id": ObjectId("6724b0f4..."),
  "file_id": ObjectId("6724b0e8..."),
  "filename": "6724b0e8..._upi_fraud_transfer_proof.txt",
  "original_name": "upi_fraud_transfer_proof.txt",
  "content_type": "text/plain",
  "file_size": 248,
  "evidence_type": "Bank Statement",
  "description": "Bank debit SMS and UPI transaction reference screenshot details",
  "uploaded_by": ObjectId("6724b0e5..."),
  "sha256_hash": "a4b1c8e9f2...",
  "created_at": ISODate("2026-10-26T14:35:00Z")
}
```

---

### Collection 6: `investigations`
Detailed inquiry milestones, Section 91 notices, IP traces, and chargesheet drafts logged by officers.

```json
{
  "_id": ObjectId("6724b0ea..."),
  "complaint_id": ObjectId("6724b0f4..."),
  "complaint_number": "CC-202610-8491",
  "officer_user_id": ObjectId("6724b0f1..."),
  "officer_name": "Inspector Vikrant Sharma",
  "officer_badge": "CYBER-OFF-001",
  "activity_type": "BANK_NOTICE_SENT",
  "title": "Immediate Freeze Request for Beneficiary UPI Handle",
  "details": "Sent emergency requisition under cyber fraud SOP to Yes Bank nodal desk.",
  "findings": "Beneficiary account belongs to an entity opened using forged documents.",
  "action_taken": "Lien mark of INR 68,000 successfully applied on recipient account.",
  "next_steps": "Issue court letter for reversal of frozen funds to victim's account.",
  "created_at": ISODate("2026-10-28T10:00:00Z")
}
```

---

### Collection 7: `notifications`
Real-time alerts delivered to citizen and officer portals.

```json
{
  "_id": ObjectId("6724b0eb..."),
  "recipient_id": ObjectId("6724b0e5..."),
  "title": "Case Assigned to Officer",
  "message": "Your complaint CC-202610-8491 has been assigned to Officer Inspector Vikrant Sharma.",
  "type": "OFFICER_ASSIGNED",
  "complaint_id": "CC-202610-8491",
  "is_read": false,
  "created_at": ISODate("2026-10-27T08:35:00Z")
}
```

---

### Collection 8: `audit_logs`
Tamper-evident logs of administrative, security, and case management actions.

```json
{
  "_id": ObjectId("6724b0ec..."),
  "user_id": ObjectId("6724b0f1..."),
  "user_email": "admin@cybercell.gov.in",
  "user_role": "admin",
  "action": "OFFICER_ASSIGNED",
  "target_entity": "complaint",
  "target_id": "6724b0f4...",
  "ip_address": "10.0.4.1",
  "user_agent": "Mozilla/5.0 ...",
  "details": {
    "complaint_id": "CC-202610-8491",
    "officer_name": "Inspector Vikrant Sharma",
    "officer_badge": "CYBER-OFF-001"
  },
  "timestamp": ISODate("2026-10-27T08:35:00Z")
}
```

---

## 3. MongoDB Indexing Strategy

### A. Unique Indexes
| Collection | Field(s) | Type | Purpose |
|---|---|---|---|
| `users` | `email: 1` | Unique | Prevents duplicate user registrations |
| `complaints` | `complaint_id: 1` | Unique | Enforces single unique reference identifier |
| `officers` | `badge_number: 1` | Unique | Enforces distinct police badge identification |
| `officers` | `user_id: 1` | Unique | One-to-one officer-to-user document linkage |
| `crime_categories` | `name: 1` | Unique | Prevents duplicate crime categories |

### B. Compound Indexes
| Collection | Fields | Sort Order | Query Target |
|---|---|---|---|
| `complaints` | `status: 1, created_at: -1` | Status ASC, Date DESC | Dashboard queue filtering & sorting |
| `complaints` | `category: 1, status: 1` | Category ASC, Status ASC | Category-based caseload inspection |
| `complaints` | `assigned_officer_id: 1, status: 1` | Officer ASC, Status ASC | Officer active caseload aggregation |
| `complaints` | `citizen_id: 1, created_at: -1` | Citizen ASC, Date DESC | Citizen portal complaint history list |
| `notifications` | `recipient_id: 1, is_read: 1, created_at: -1` | User ASC, Read ASC, Date DESC | Unread notifications drawer query |
| `audit_logs` | `action: 1, timestamp: -1` | Action ASC, Date DESC | Forensic security audit queries |

### C. Text Indexes
- Collection: `complaints`
- Fields: `description: "text"`, `complaint_id: "text"`, `incident_location: "text"`, `citizen_name: "text"`
- Weights: `{"complaint_id": 10, "description": 5, "citizen_name": 3, "incident_location": 2}`
- Enables fast keyword and suspect search across complaints.

---

## 4. Schema Validation ($jsonSchema)

All collections enforce validation levels at the database tier using MongoDB's `$jsonSchema` engine.

Example validation rules defined in `database/validators.py`:
- `complaints`: Required fields `[complaint_id, citizen_id, category, description, status]`. Enums for `status` (`Submitted`, `Under Review`, `Assigned`, `Investigation in Progress`, `Resolved`, `Rejected`, `Closed`) and `priority` (`Low`, `Medium`, `High`, `Critical`).
- `users`: Required fields `[full_name, email, password_hash, role]`, with regex pattern validation for email addresses.

---

## 5. MongoDB Aggregation Pipelines

### A. Dashboard Overview Pipeline ($facet)
Computes status counts, priority breakdown, and financial totals in a single database round-trip:

```javascript
db.complaints.aggregate([
  {
    $facet: {
      "status_counts": [
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ],
      "priority_counts": [
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ],
      "financial_stats": [
        {
          $group: {
            _id: null,
            total_loss: { $sum: "$financial_loss" },
            avg_loss: { $avg: "$financial_loss" },
            max_loss: { $max: "$financial_loss" }
          }
        }
      ],
      "total_count": [{ $count: "count" }]
    }
  }
])
```

### B. Monthly Case Trend Pipeline ($group & $dateToString)
Groups incidents into monthly buckets and calculates total lodged cases vs resolved cases:

```javascript
db.complaints.aggregate([
  {
    $project: {
      year_month: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
      status: 1,
      financial_loss: 1
    }
  },
  {
    $group: {
      _id: "$year_month",
      count: { $sum: 1 },
      resolved_count: {
        $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] }
      },
      total_loss: { $sum: "$financial_loss" }
    }
  },
  { $sort: { _id: 1 } }
])
```

### C. Officer Workload & Clearance Pipeline ($lookup & $unwind)
Performs multi-collection joins between `officers`, `users`, and `complaints`:

```javascript
db.officers.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "_id",
      as: "user_info"
    }
  },
  { $unwind: "$user_info" },
  {
    $lookup: {
      from: "complaints",
      localField: "_id",
      foreignField: "assigned_officer_id",
      as: "assigned_cases"
    }
  },
  {
    $project: {
      badge_number: 1,
      rank: 1,
      department: 1,
      active_cases_count: 1,
      resolved_cases_count: 1,
      name: "$user_info.full_name",
      email: "$user_info.email",
      total_assigned: { $size: "$assigned_cases" }
    }
  },
  { $sort: { active_cases_count: -1 } }
])
```

---

## 6. GridFS Evidence Engine & Cryptographic Integrity

To handle digital forensics evidence (screenshots, PDFs, server logs) without hitting the 16MB BSON document limit:
1. Files are partitioned into **255 KB chunks** stored in `fs.chunks`.
2. Metadata is cataloged in `fs.files` with mime type and custom tags.
3. Every uploaded file generates a **SHA-256 cryptographic digest** stored directly in the `evidence` collection.
4. When streaming or retrieving files via `GET /api/evidence/<id>`, the server returns an `X-SHA256-Checksum` header to verify the digital chain of custody.
