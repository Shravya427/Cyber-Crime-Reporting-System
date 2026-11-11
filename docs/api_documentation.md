# REST API Specification & Documentation
## Cyber Crime Reporting and Investigation Management System

All endpoints accept and return JSON unless otherwise stated. Authentication is handled using signed JSON Web Tokens (JWT) passed in the `Authorization` header.

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Registers a new citizen account.
- **Access**: Public
- **Request Body**:
```json
{
  "full_name": "Rahul Mehta",
  "email": "rahul.mehta@gmail.com",
  "password": "Citizen@123",
  "phone": "+91 99100 23456",
  "address": "Bellandur, Bengaluru",
  "id_proof_type": "Aadhaar",
  "id_proof_number": "XXXX-XXXX-8921",
  "role": "citizen"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "_id": "6724b0e5...",
      "full_name": "Rahul Mehta",
      "email": "rahul.mehta@gmail.com",
      "role": "citizen"
    }
  }
}
```

### `POST /api/auth/login`
Authenticates a user (Citizen, Officer, or Admin) and issues a JWT token.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@cybercell.gov.in",
  "password": "Admin@123"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "6724b0f1...",
      "full_name": "Dr. Rajeshwar Sen",
      "email": "admin@cybercell.gov.in",
      "role": "admin"
    }
  }
}
```

### `GET /api/auth/me`
Retrieves current authenticated user's profile.
- **Access**: Authenticated

---

## 2. Complaint Management Endpoints

### `POST /api/complaints`
Lodges a new cybercrime complaint. Automatically assigns a unique Complaint ID (`CC-YYYYMM-XXXX`) and sets status to `"Submitted"`.
- **Access**: Citizen (`role: citizen`)
- **Request Body**:
```json
{
  "category": "UPI Fraud",
  "incident_date": "2026-10-26",
  "incident_time": "14:35",
  "incident_location": "Bengaluru (Google Pay)",
  "description": "Scammer sent fake electricity bill message...",
  "financial_loss": 85000,
  "priority": "Critical",
  "suspect_name": "Ramesh Kumar",
  "suspect_phone": "+91 98765 43210",
  "suspect_upi": "fastcashback.verify@ybl",
  "suspect_bank_account": "Kotak Mahindra Bank - 89230192841"
}
```
- **Response**: `201 Created`

### `GET /api/complaints`
Retrieves a paginated list of complaints.
- **Access**: Authenticated (Role-scoped: Citizens see only their own complaints; Officers see assigned complaints; Admins see all).
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category name
  - `status`: Filter by status
  - `priority`: Filter by priority
  - `search`: Keyword search matching ID, description, suspect, or citizen
  - `scope`: `'my'` or `'all'` (for officers)
- **Response**: `200 OK`

### `GET /api/complaints/<id>`
Retrieves full details of a single complaint, including digital evidence catalog and investigation notes.
- **Access**: Authenticated (Citizen owner, Officer, Admin)

### `PUT /api/complaints/<id>/assign`
Assigns an investigation officer to a complaint. Moves status to `"Assigned"`.
- **Access**: Admin (`role: admin`)
- **Request Body**:
```json
{
  "officer_id": "6724b0f2...",
  "priority": "High",
  "notes": "Assigned for immediate bank freeze notice"
}
```

### `PUT /api/complaints/<id>/status`
Updates case status, adds status transition notes, or records case resolution / rejection.
- **Access**: Officer or Admin
- **Request Body**:
```json
{
  "status": "Resolved",
  "resolution_summary": "Beneficiary account lien-marked; INR 68,000 reversed under court order.",
  "notes": "Case successfully concluded."
}
```

### `POST /api/complaints/<id>/investigation-notes`
Records a forensic investigation milestone entry.
- **Access**: Officer or Admin
- **Request Body**:
```json
{
  "activity_type": "BANK_NOTICE_SENT",
  "title": "Section 91 CrPC Notice Dispatched",
  "details": "Sent official request to Yes Bank nodal officer.",
  "findings": "Beneficiary account KYC belongs to mule operative.",
  "action_taken": "Account frozen.",
  "next_steps": "Issue Magistrate recovery notice."
}
```

---

## 3. Digital Evidence & GridFS Endpoints

### `POST /api/evidence/upload/<complaint_id>`
Uploads a binary evidence file (screenshot, PDF, log) directly into MongoDB GridFS and calculates a SHA-256 integrity hash.
- **Access**: Authenticated
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file (PNG, JPG, PDF, TXT, CSV up to 16MB)
  - `evidence_type`: `Screenshot` | `Bank Statement` | `Chat Log` | `Email Header` | `Other`
  - `description`: Text note describing the evidence

### `GET /api/evidence/<evidence_id>`
Streams the binary file directly from MongoDB GridFS with appropriate `Content-Type` and `X-SHA256-Checksum` header for forensic chain-of-custody verification.
- **Access**: Public / Authenticated

---

## 4. Analytics & Aggregation Endpoints

### `GET /api/analytics/admin`
Computes system-wide operational metrics using MongoDB `$facet`, `$group`, `$project`, and `$lookup` aggregation pipelines.
- **Access**: Admin (`role: admin`)
- **Returns**: Status counters, priority breakdown, category distribution, monthly trends, officer workload, and financial totals.

### `GET /api/analytics/officer`
Computes caseload metrics for the logged-in officer.
- **Access**: Officer (`role: officer`)

### `GET /api/analytics/citizen`
Computes personal complaint counts and financial losses for the citizen.
- **Access**: Citizen (`role: citizen`)

---

## 5. Administrative & Export Endpoints

### `GET /api/admin/users`
Lists registered users with optional role filtering and pagination.
- **Access**: Admin

### `PUT /api/admin/users/<id>/toggle-status`
Toggles a user account between active and suspended.
- **Access**: Admin

### `GET /api/admin/officers`
Lists all officers with their active caseload and resolution counts.
- **Access**: Admin

### `POST /api/admin/officers`
Registers a new officer profile.
- **Access**: Admin

### `GET /api/admin/categories`
Retrieves all cybercrime categories.
- **Access**: Public / Authenticated

### `POST /api/admin/categories`
Creates a new cybercrime category with default SLA targets.
- **Access**: Admin

### `GET /api/admin/audit-logs`
Retrieves security audit logs with action filters and pagination.
- **Access**: Admin

### `GET /api/admin/export/complaints`
Exports all registered complaints to downloadable CSV format.
- **Access**: Admin

### `GET /api/admin/export/audit-logs`
Exports system audit logs to downloadable CSV format.
- **Access**: Admin

---

## 6. Notifications Endpoints

### `GET /api/notifications`
Retrieves notifications for the authenticated user.
- **Access**: Authenticated

### `PUT /api/notifications/<id>/read`
Marks a specific notification as read.
- **Access**: Authenticated

### `PUT /api/notifications/read-all`
Marks all notifications as read for the authenticated user.
- **Access**: Authenticated
