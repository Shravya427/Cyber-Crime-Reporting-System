# 🛡️ Cyber Crime Reporting and Investigation Management System

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.2-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x%20%2F%20Atlas-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> An enterprise-grade, full-stack cybercrime incident reporting, digital forensics evidence repository, and law enforcement case management portal built with **Flask**, **React**, and **MongoDB**.

---

## 📌 Problem Statement

In the modern digital era, the exponential surge in cyber financial fraud (UPI scams, phishing, card skimming), identity theft, and online harassment has overwhelmed traditional law enforcement mechanisms. Key challenges include:

1. **Fragmented & Delayed Reporting**: Citizens struggle to quickly report incidents with standardized forensic evidence before fraudulent transactions settle or malicious infrastructure disappears.
2. **Chain-of-Custody Integrity**: Digital evidence (screenshots, transaction receipts, network logs) often lacks cryptographic verification, making it vulnerable to tampering claims in legal proceedings.
3. **Inefficient Case Triage & Workload Allocation**: Investigation departments lack real-time visibility into incoming case volumes, officer workloads, and clearance rates.
4. **Lack of Transparency**: Complainants are rarely provided transparent, auditable timelines of investigation progress.

**This project solves these challenges** by providing a unified, secure platform with role-based access control, cryptographic evidence integrity (SHA-256 in MongoDB GridFS), real-time aggregation metrics, and end-to-end investigation lifecycle management.

---

## 🚀 Main Features

### 👤 Citizen Portal
- **Rapid Incident Registration**: Multi-step reporting wizard for financial cybercrimes, identity theft, phishing, malware, and cyber harassment.
- **Digital Evidence Vault**: Complainants can attach multiple digital evidence files (screenshots, PDFs, transaction statements) directly into MongoDB GridFS.
- **Live Case Tracking**: Real-time status tracker via unique Complaint Reference ID (e.g., `CC-202611-XXXX`) with an interactive investigation milestone timeline.
- **In-App Real-time Notifications**: Instant updates whenever an officer is assigned, status transitions, or inquiry notes are posted.

### 🔍 Investigation Officer Portal
- **Case Triage & Prioritization**: Filter and inspect incoming complaints by priority (`Critical`, `High`, `Medium`, `Low`), category, or filing date.
- **Evidence Verification & Chain of Custody**: View and download evidence files with tamper-evident **SHA-256 hash checksum verification**.
- **Investigation Milestone Logging**: Record forensic activity entries (Bank freeze notices under Sec 91 CrPC, IP traces, CDR requests, suspect interrogations).
- **Status Lifecycle Control**: Seamless state transitions (`Submitted` → `Under Review` → `Assigned` → `Investigation in Progress` → `Resolved` / `Rejected` / `Closed`).

### ⚡ Administrator Command Center
- **Executive Analytics Dashboard**:
  - Real-time crime distribution via MongoDB `$group` and `$facet` pipelines.
  - Monthly complaint trends and resolution velocity charts powered by **Chart.js**.
  - Officer workload distribution and clearance ratios computed dynamically via `$lookup`.
- **Officer & Workload Management**: Register new police officers, assign badges, ranks, jurisdictions, and balance active case loads.
- **Tamper-Evident Audit Trail**: Comprehensive logging of user sessions, evidence uploads, status modifications, and client IP addresses.
- **One-Click CSV Export**: Instant generation of standardized audit logs and complaint reports for external reporting.

---

## 🛠️ Technologies Used

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Lucide React (Icons), Chart.js & React-Chartjs-2, CSS3 Design System |
| **Backend** | Python 3.10+, Flask 3.1, PyMongo 4.19, Flask-CORS, python-dotenv |
| **Database** | MongoDB 8.x / MongoDB Atlas, GridFS (Forensic evidence chunking) |
| **Security & Auth** | JWT (JSON Web Tokens via PyJWT), Bcrypt password hashing, RBAC Middleware, SHA-256 checksums |
| **API Architecture** | RESTful API design with structured JSON responses and HTTP status codes |

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Citizen / Officer / Administrator]) -->|HTTPS / REST API| Frontend[React 19 + Vite SPA]
    Frontend -->|JWT Authentication & Bearer Tokens| Backend[Python Flask REST API]
    
    Backend -->|PyMongo Driver| DB[(MongoDB 8.x / Atlas Database)]
    
    subgraph MongoDB Database Tier
        DB --> Users[users collection]
        DB --> Officers[officers collection]
        DB --> Complaints[complaints collection]
        DB --> Evidence[evidence metadata catalog]
        DB --> GridFS[fs.files & fs.chunks (Evidence Vault)]
        DB --> Audit[audit_logs collection]
        DB --> Notifs[notifications collection]
        DB --> Categories[crime_categories]
    end
    
    Backend -->|Forensic SHA-256 Checksum| GridFS
    Backend -->|Aggregation Pipelines: $facet, $lookup, $group| Analytics[Real-Time Analytics]
```

---

## 🔑 Demonstration Accounts

The portal features **1-Click Quick Demo Access** on the login page for rapid evaluation:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@cybercell.gov.in` | `Admin@123` | Command Center, Officer Allocation, Global Analytics |
| **Investigation Officer** | `officer.sharma@cybercell.gov.in` | `Officer@123` | Financial Cyber Fraud Wing • Case Triage & Forensics |
| **Investigation Officer** | `officer.verma@cybercell.gov.in` | `Officer@123` | Cyber Intelligence Specialist • Case Investigation |
| **Registered Citizen** | `rahul.mehta@gmail.com` | `Citizen@123` | Active UPI Fraud complaint & live timeline |
| **Registered Citizen** | `priya.sharma@gmail.com` | `Citizen@123` | Resolved Phishing case history |

---

## 📁 Project Folder Structure

```
Cyber_Crime_Reporting_System/
├── backend/
│   ├── app.py                      # Flask application factory & SPA router
│   ├── config.py                   # Configuration and environment variables
│   ├── requirements.txt            # Backend Python dependencies
│   ├── middleware/
│   │   └── auth_middleware.py      # JWT validation and RBAC protection
│   ├── routes/
│   │   ├── admin_routes.py         # Officer management, category control, CSV export
│   │   ├── analytics_routes.py     # Aggregation-driven metrics & chart data
│   │   ├── auth_routes.py          # Registration, login, profile management
│   │   ├── complaint_routes.py     # Complaint filing, triage, assignment & timeline
│   │   ├── evidence_routes.py      # GridFS file streaming, upload & SHA-256 checksums
│   │   └── notification_routes.py  # User notifications
│   ├── services/
│   │   ├── analytics_service.py    # MongoDB aggregation pipelines ($facet, $lookup, $group)
│   │   ├── audit_service.py        # Cryptographic and operational audit logs
│   │   ├── auth_service.py         # Bcrypt encryption & JWT generation
│   │   ├── complaint_service.py    # Complaint lifecycle business logic
│   │   ├── evidence_service.py     # GridFS chunking & SHA-256 calculation
│   │   └── notification_service.py # In-app notification dispatcher
│   ├── uploads/                    # Local storage fallback directory
│   └── utils/
│       ├── db.py                   # MongoClient initialization, GridFS, transaction handling
│       └── helpers.py              # Unique ID generator, response formatters, hashing
├── database/
│   ├── indexes.py                  # Compound, unique, and full-text MongoDB indexes
│   ├── seed_data.py                # Database seeder with realistic synthetic cases
│   └── validators.py               # MongoDB $jsonSchema strict validation schemas
├── docs/
│   ├── api_documentation.md        # Comprehensive REST API endpoint reference
│   └── database_design.md          # Schema designs, ER diagrams, aggregation breakdown
├── frontend/
│   ├── public/                     # Static assets, SVG icons, favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Centralized API fetch wrapper with token headers
│   │   ├── assets/                 # Brand graphics and hero artwork
│   │   ├── components/
│   │   │   ├── ComplaintDetailModal.jsx # Forensic case modal & milestone timeline
│   │   │   ├── FileComplaintModal.jsx   # Multi-step complaint filing modal
│   │   │   ├── Navbar.jsx          # Top navigation bar with notifications badge
│   │   │   └── Sidebar.jsx         # Role-tailored navigation & database status
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication state, login, and demo helpers
│   │   ├── views/
│   │   │   ├── AdminDashboard.jsx  # High-level analytics, charts & officer manager
│   │   │   ├── CitizenDashboard.jsx# Citizen case tracker & report submission
│   │   │   ├── LoginPage.jsx       # Unified portal login with 1-click buttons
│   │   │   └── OfficerDashboard.jsx# Investigation triage, remarks & case closure
│   │   ├── App.css                 # Component layout styling
│   │   ├── App.jsx                 # Master router and role authorization gate
│   │   ├── index.css               # Cybersecurity Navy/Cyan theme design system
│   │   └── main.jsx                # React DOM entrypoint
│   ├── index.html                  # HTML5 document template
│   ├── package.json                # Frontend dependencies and npm scripts
│   └── vite.config.js              # Vite build setup with backend proxy
├── .env.example                    # Template environment variables
├── .gitignore                      # Git exclusion rules for secrets, caches, and modules
├── check_db.py                     # CLI diagnostic script to inspect MongoDB collections
├── README.md                       # Comprehensive project documentation
├── requirements.txt                # Root-level Python dependencies
└── run.py                          # One-command quickstart launcher
```

---

## ⚡ Installation & Setup Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**
- **MongoDB Server** (Running locally on `mongodb://localhost:27017/` or MongoDB Atlas connection string)

### 2. Clone the Repository
```bash
git clone https://github.com/Shravya427/Cyber-Crime-Reporting-System.git
cd Cyber-Crime-Reporting-System
```

### 3. Environment Configuration
Copy the template environment file:
```bash
# On Windows PowerShell
Copy-Item .env.example .env

# On Linux / macOS
cp .env.example .env
```
Ensure `.env` matches your environment:
```ini
PORT=5000
FLASK_ENV=development
SECRET_KEY=your_jwt_secret_key_here_change_in_production
JWT_EXPIRATION_HOURS=24
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=cyber_crime_reporting_db
FRONTEND_URL=http://localhost:5173
```

### 4. Install Python Dependencies & Initialize Database
```bash
# Install Python packages
pip install -r requirements.txt

# Run the automated database seeder (creates indexes, validators, and demo accounts)
python database/seed_data.py
```

### 5. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 🖥️ How to Run the Project

### Option A: Quickstart Unified Mode (Recommended)
Build the frontend once and let Flask serve both the API and the React SPA on a single port:

```bash
# 1. Build frontend bundle
cd frontend
npm run build
cd ..

# 2. Run the unified launcher
python run.py
```
> The launcher will automatically verify MongoDB, ensure sample data is seeded, start the web server on `http://localhost:5000`, and launch your default browser.

### Option B: Developer Mode (Hot-Reloading)
Run backend and frontend independently for active code development:

**Terminal 1 (Flask Backend):**
```bash
python backend/app.py
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (React Vite HMR):**
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🖼️ User Interface & Visual Showcase

The user interface uses a **Cyber Defense Command Center** aesthetic with glassmorphic cards, glowing cyan/blue highlights, responsive data tables, and interactive Chart.js visualizations.

- **Login Portal**: Features role-based credentials and 1-click evaluation buttons.
- **Citizen Dashboard**: Displays lodged complaints, status badges, and complaint submission modal.
- **Investigation Officer Portal**: Case filter queue, forensic evidence inspector, and case milestone logging.
- **Admin Command Center**: Interactive crime distribution doughnut chart, monthly trends bar chart, and officer workload allocation.

*(Preview hero artwork located at `frontend/src/assets/hero.png`)*

---

## 🔮 Future Enhancements

- [ ] **AI-Powered Crime Pattern Detection**: Integrating NLP and machine learning models to cluster related phishing links and detect repeating suspect bank accounts/UPI IDs across jurisdictions.
- [ ] **Automated First Information Report (FIR) Generation**: Auto-generating digitally signed PDF FIR documents ready for court submission.
- [ ] **SMS & WhatsApp Gateway Alerts**: Immediate complainant status updates via Twilio / WhatsApp Business API.
- [ ] **Blockchain Evidence Hashing**: Storing SHA-256 evidence hashes onto an immutable decentralized ledger for cryptographic chain-of-custody verification.
- [ ] **Multi-Agency Inter-State Collaboration**: Secure protocol for exchanging suspect intelligence and frozen bank accounts between state cyber police divisions.

---

## 📄 License & Attribution

This project is licensed under the [MIT License](LICENSE). Developed for academic and demonstration purposes in Advanced Database Management Systems (DBMS). Synthetic demonstration data only.
