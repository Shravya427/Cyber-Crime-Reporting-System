import sys
import io
import hashlib
from pathlib import Path
from datetime import datetime, timezone, timedelta
from bson import ObjectId

project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.utils.db import get_db, get_gridfs
from backend.utils.helpers import hash_password, calculate_sha256
from database.validators import apply_validators
from database.indexes import create_indexes

def seed_database():
    db = get_db()
    fs = get_gridfs()

    print("==================================================================")
    print("SEEEING ADVANCED CYBER CRIME REPORTING & INVESTIGATION SYSTEM DB")
    print("==================================================================")

    # Clean existing collections
    collections = ['users', 'officers', 'complaints', 'crime_categories', 'evidence', 'investigations', 'notifications', 'audit_logs']
    for coll in collections:
        db[coll].delete_many({})
    
    # Clean GridFS files & chunks
    db['fs.files'].delete_many({})
    db['fs.chunks'].delete_many({})
    print("Cleared existing database records.")

    # Apply Schema Validators & Indexes
    apply_validators(db)
    create_indexes(db)

    now = datetime.now(timezone.utc)

    # 1. SEED CRIME CATEGORIES
    categories_data = [
        {"name": "Phishing", "description": "Deceptive emails, fake portals, and credential harvesting links designed to steal passwords or banking credentials.", "default_severity": "High", "sla_days": 3},
        {"name": "Online Financial Fraud", "description": "Unauthorized bank transfers, investment scams, lottery fraud, and debit/credit card unauthorized transactions.", "default_severity": "Critical", "sla_days": 2},
        {"name": "Identity Theft", "description": "Impersonation, unauthorized SIM swap, fraudulent loan applications taken using victim's Aadhaar or PAN details.", "default_severity": "High", "sla_days": 5},
        {"name": "Social Media Hacking", "description": "Unauthorized access, hijacking of Instagram, Facebook, LinkedIn, Twitter or WhatsApp accounts.", "default_severity": "Medium", "sla_days": 4},
        {"name": "Cyberbullying", "description": "Repeated harassment, abusive messaging, trolling, and intimidation of individuals on digital platforms.", "default_severity": "Medium", "sla_days": 5},
        {"name": "Online Harassment", "description": "Stalking, non-consensual image sharing, threatening communications, and doxxing on public forums.", "default_severity": "High", "sla_days": 2},
        {"name": "UPI Fraud", "description": "QR code scanning traps, fraudulent collect requests, fake cashback links, and payment gateway impersonation.", "default_severity": "Critical", "sla_days": 1},
        {"name": "Email Hacking", "description": "Business Email Compromise (BEC), CEO fraud, spear phishing, and illicit inbox forwarding rules.", "default_severity": "High", "sla_days": 3},
        {"name": "Fake Websites", "description": "Lookalike counterfeit e-commerce portals, fake job portals, government portal clones stealing data or payments.", "default_severity": "Medium", "sla_days": 4},
        {"name": "Other Cyber Crimes", "description": "Ransomware threats, DDoS attacks, cryptocurrency scams, and unclassified computer violations.", "default_severity": "Medium", "sla_days": 7}
    ]

    for cat in categories_data:
        cat["is_active"] = True
        cat["created_at"] = now - timedelta(days=60)
        db.crime_categories.insert_one(cat)
    print(f"  [OK] Seeded {len(categories_data)} cybercrime categories.")

    # 2. SEED USERS & OFFICERS
    # Admin User
    admin_id = ObjectId()
    admin_user = {
        "_id": admin_id,
        "full_name": "Dr. Rajeshwar Sen (Director General)",
        "email": "admin@cybercell.gov.in",
        "password_hash": hash_password("Admin@123"),
        "phone": "+91 98110 01100",
        "role": "admin",
        "address": "State Cyber Command Center, Tower B, Sector 62",
        "is_active": True,
        "created_at": now - timedelta(days=120),
        "last_login": now - timedelta(hours=1)
    }
    db.users.insert_one(admin_user)

    # Officers
    officers_seed = [
        {
            "name": "Inspector Vikrant Sharma",
            "email": "officer.sharma@cybercell.gov.in",
            "badge": "CYBER-OFF-001",
            "rank": "Inspector",
            "dept": "Financial Cyber Fraud Wing",
            "spec": ["UPI Fraud", "Online Financial Fraud", "Phishing"],
            "phone": "+91 98220 12345"
        },
        {
            "name": "Forensics Specialist Sneha Verma",
            "email": "officer.verma@cybercell.gov.in",
            "badge": "CYBER-OFF-002",
            "rank": "Cyber Forensics Specialist",
            "dept": "Cyber Intelligence & Malware Forensics Unit",
            "spec": ["Email Hacking", "Identity Theft", "Fake Websites"],
            "phone": "+91 98330 67890"
        },
        {
            "name": "Sub-Inspector Arjun Patel",
            "email": "officer.patel@cybercell.gov.in",
            "badge": "CYBER-OFF-003",
            "rank": "Sub-Inspector",
            "dept": "Social Media Crimes & Cyber Harassment Cell",
            "spec": ["Social Media Hacking", "Cyberbullying", "Online Harassment"],
            "phone": "+91 98440 54321"
        }
    ]

    officer_docs = []
    for o in officers_seed:
        u_id = ObjectId()
        u_doc = {
            "_id": u_id,
            "full_name": o["name"],
            "email": o["email"],
            "password_hash": hash_password("Officer@123"),
            "phone": o["phone"],
            "role": "officer",
            "address": "Cyber Police Station, Cyber Forensic Division",
            "is_active": True,
            "created_at": now - timedelta(days=90),
            "last_login": now - timedelta(hours=2)
        }
        db.users.insert_one(u_doc)

        off_id = ObjectId()
        off_doc = {
            "_id": off_id,
            "user_id": u_id,
            "badge_number": o["badge"],
            "rank": o["rank"],
            "department": o["dept"],
            "specialization": o["spec"],
            "active_cases_count": 0,
            "resolved_cases_count": 0,
            "is_available": True,
            "created_at": now - timedelta(days=90)
        }
        db.officers.insert_one(off_doc)
        officer_docs.append({**off_doc, "user_info": u_doc})
    print(f"  [OK] Seeded Admin and {len(officer_docs)} Investigation Officers.")

    # Citizens
    citizens_seed = [
        {
            "name": "Rahul Mehta",
            "email": "rahul.mehta@gmail.com",
            "phone": "+91 99100 23456",
            "address": "402, Green Glen Layout, Bellandur, Bengaluru",
            "id_type": "Aadhaar",
            "id_num": "XXXX-XXXX-8921"
        },
        {
            "name": "Priya Sharma",
            "email": "priya.sharma@gmail.com",
            "phone": "+91 98200 45678",
            "address": "B-12, Palm Meadows, Whitefield, Bengaluru",
            "id_type": "PAN",
            "id_num": "ABCPS8492K"
        },
        {
            "name": "Ananya Deshmukh",
            "email": "ananya.deshmukh@gmail.com",
            "phone": "+91 97300 89123",
            "address": "Flat 701, Pride Heights, Kothrud, Pune",
            "id_type": "Passport",
            "id_num": "V8921472"
        }
    ]

    citizen_users = []
    for c in citizens_seed:
        u_id = ObjectId()
        u_doc = {
            "_id": u_id,
            "full_name": c["name"],
            "email": c["email"],
            "password_hash": hash_password("Citizen@123"),
            "phone": c["phone"],
            "role": "citizen",
            "address": c["address"],
            "id_proof_type": c["id_type"],
            "id_proof_number": c["id_num"],
            "is_active": True,
            "created_at": now - timedelta(days=45),
            "last_login": now - timedelta(hours=3)
        }
        db.users.insert_one(u_doc)
        citizen_users.append(u_doc)
    print(f"  [OK] Seeded {len(citizen_users)} Registered Citizens.")

    # 3. SEED GRIDFS SAMPLE EVIDENCE FILES
    def store_sample_file(filename, content_bytes, content_type):
        sha = hashlib.sha256(content_bytes).hexdigest()
        grid_id = fs.put(content_bytes, filename=filename, content_type=content_type, sha256=sha)
        return grid_id, sha, len(content_bytes)

    sample_evidence_records = []
    # Sample file 1: Fake UPI Screenshot log
    sample_text1 = b"=== UPI PAYMENT TRANSACTION LOG ===\nTxn ID: UPI/20261028/9982410294\nSender: rahul.mehta@okaxis\nBeneficiary: fastcashback.verify@ybl\nAmount: INR 85,000.00\nStatus: SUCCESS\nGateway IP: 103.44.12.98\nTarget APK installed: UpdateYourBankKYC.apk"
    g_id1, sha1, size1 = store_sample_file("upi_fraud_transfer_proof.txt", sample_text1, "text/plain")

    # Sample file 2: Phishing Headers log
    sample_text2 = b"Received: from mail-relay.phishnet-host.com (185.220.101.44)\nAuthentication-Results: spf=fail; dkim=fail; dmarc=fail\nSubject: URGENT: NetBanking Account Suspended - Verify KYC Now\nPhishing URL: https://secure-netbank-sbi-portal-verify.in/login.php"
    g_id2, sha2, size2 = store_sample_file("phishing_email_headers.txt", sample_text2, "text/plain")

    # Sample file 3: Social Media Defamation Chat Log
    sample_text3 = b"=== CHAT EVIDENCE ARCHIVE ===\nTarget Profile: @cyber_hacker_7849\nVictim: Ananya Deshmukh\nThreat Transcript: Pay 2.5 Lakhs in crypto or your cloned images will be distributed to contacts.\nTimestamp: 2026-10-24 23:14 IST"
    g_id3, sha3, size3 = store_sample_file("extortion_chat_evidence.txt", sample_text3, "text/plain")

    # 4. SEED COMPLAINTS WITH EMBEDDED INVESTIGATION TIMELINES
    complaints_seed_data = [
        {
            "complaint_id": "CC-202610-8491",
            "citizen": citizen_users[0],
            "category": "UPI Fraud",
            "incident_date": now - timedelta(days=6),
            "incident_time": "14:35 IST",
            "location": "Bengaluru (Online / Google Pay)",
            "description": "Received an automated SMS stating electricity power would be disconnected within 2 hours due to pending bill. Contacted the provided helpline number 9876543210. The scammer instructed to download 'QuickSupport' app and scan a QR code to pay Rs 11. Upon scanning, three unauthorized transactions debited INR 85,000 to an unknown UPI handle.",
            "suspect": {
                "name": "Ramesh Kumar (Impersonating BESCOM Support)",
                "phone": "+91 98765 43210",
                "upi_id": "fastcashback.verify@ybl",
                "bank_account": "Kotak Mahindra Bank - 89230192841",
                "website_url": "http://bescom-bill-update-desk.com",
                "other_details": "Claimed to be officer in BESCOM IT dept."
            },
            "financial_loss": 85000.0,
            "priority": "Critical",
            "status": "Investigation in Progress",
            "officer": officer_docs[0], # Inspector Sharma
            "evidence_item": {
                "file_id": g_id1,
                "filename": "upi_fraud_transfer_proof.txt",
                "content_type": "text/plain",
                "size": size1,
                "sha256": sha1,
                "type": "Bank Statement",
                "desc": "Bank debit SMS and UPI transaction reference screenshot details"
            },
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[0]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Citizen submitted complaint with UPI transaction logs.",
                    "timestamp": now - timedelta(days=6)
                },
                {
                    "stage": "ASSIGNMENT",
                    "action": f"Assigned to {officer_docs[0]['user_info']['full_name']} ({officer_docs[0]['badge_number']})",
                    "status": "Assigned",
                    "performed_by_name": admin_user["full_name"],
                    "performed_by_role": "admin",
                    "notes": "High financial loss. Assigned to Financial Cyber Fraud Wing for urgent bank freeze notice.",
                    "timestamp": now - timedelta(days=5, hours=18)
                },
                {
                    "stage": "INVESTIGATION_NOTE",
                    "action": "Section 91 CrPC Notice Sent to Payment Gateway",
                    "status": "Investigation in Progress",
                    "performed_by_name": officer_docs[0]['user_info']['full_name'],
                    "performed_by_role": "officer",
                    "notes": "Formal Section 91 CrPC notice dispatched to Yes Bank and PhonePe fraud desk to freeze the beneficiary account.",
                    "timestamp": now - timedelta(days=4)
                }
            ],
            "investigation_note": {
                "activity_type": "BANK_NOTICE_SENT",
                "title": "Immediate Freeze Request for Beneficiary UPI Handle",
                "details": "Sent emergency requisition under cyber fraud SOP to Yes Bank nodal desk.",
                "findings": "Beneficiary account fastcashback.verify@ybl belongs to an entity opened using forged documents in Jamtara hub.",
                "action_taken": "Lien mark of INR 68,000 successfully applied on recipient account.",
                "next_steps": "Issue court letter for reversal of frozen funds to victim's account."
            }
        },
        {
            "complaint_id": "CC-202610-6214",
            "citizen": citizen_users[1],
            "category": "Phishing",
            "incident_date": now - timedelta(days=12),
            "incident_time": "09:15 IST",
            "location": "Bengaluru (NetBanking / Email)",
            "description": "Received an official-looking email claiming my SBI NetBanking profile required immediate PAN verification. Clicked the embedded link which loaded an exact replica of SBI Netbanking portal. Entered username, password, and OTP. Within 15 minutes, funds were transferred out.",
            "suspect": {
                "name": "Unknown Phishing Syndicate",
                "phone": "+91 89123 77889",
                "upi_id": "",
                "bank_account": "State Bank of India - 30894182910",
                "website_url": "https://secure-netbank-sbi-portal-verify.in",
                "other_details": "Domain registered via NameCheap using Russian reverse proxy."
            },
            "financial_loss": 150000.0,
            "priority": "High",
            "status": "Resolved",
            "officer": officer_docs[1], # Forensics Specialist Sneha Verma
            "resolution_summary": "Phishing domain taken down with CERT-In cooperation. Beneficiary account intercepted in time; INR 1,42,000 recovered and credited back to victim under Court order dated 28-Oct-2026.",
            "evidence_item": {
                "file_id": g_id2,
                "filename": "phishing_email_headers.txt",
                "content_type": "text/plain",
                "size": size2,
                "sha256": sha2,
                "type": "Email Header",
                "desc": "Full email MIME headers revealing originating SMTP server and spoofed domain"
            },
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[1]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Citizen lodged complaint with phishing email headers.",
                    "timestamp": now - timedelta(days=12)
                },
                {
                    "stage": "ASSIGNMENT",
                    "action": f"Assigned to {officer_docs[1]['user_info']['full_name']} ({officer_docs[1]['badge_number']})",
                    "status": "Assigned",
                    "performed_by_name": admin_user["full_name"],
                    "performed_by_role": "admin",
                    "notes": "Credential harvesting attack. Assigned to Cyber Forensics Unit.",
                    "timestamp": now - timedelta(days=11)
                },
                {
                    "stage": "STATUS_UPDATE",
                    "action": "Investigation in Progress",
                    "status": "Investigation in Progress",
                    "performed_by_name": officer_docs[1]['user_info']['full_name'],
                    "performed_by_role": "officer",
                    "notes": "Domain takedown request issued via NCIIPC and CERT-In.",
                    "timestamp": now - timedelta(days=9)
                },
                {
                    "stage": "STATUS_UPDATE",
                    "action": "Status changed to Resolved",
                    "status": "Resolved",
                    "performed_by_name": officer_docs[1]['user_info']['full_name'],
                    "performed_by_role": "officer",
                    "notes": "Case successfully concluded. Recovered funds re-credited to complainant.",
                    "timestamp": now - timedelta(days=2)
                }
            ],
            "investigation_note": {
                "activity_type": "FORENSIC_REPORT",
                "title": "Malicious Domain Takedown & Fund Recovery Notice",
                "details": "Conducted WHOIS and DNS investigation on fraudulent domain.",
                "findings": "IP traced to foreign bulletproof hosting. Fast-flux DNS was active.",
                "action_taken": "CERT-In blocked host. Receiving branch intercepted transfer.",
                "next_steps": "Case closed with recovery report filed to Magistrate."
            }
        },
        {
            "complaint_id": "CC-202610-7389",
            "citizen": citizen_users[2],
            "category": "Social Media Hacking",
            "incident_date": now - timedelta(days=8),
            "incident_time": "22:10 IST",
            "location": "Pune / Instagram",
            "description": "My Instagram handle (@ananya_designs) was hijacked after receiving a copyright infringement DM from a fake support account. The hacker changed my recovery email and two-factor authentication number and is now soliciting money from my followers claiming a medical emergency.",
            "suspect": {
                "name": "Impersonator @meta_copyright_team",
                "phone": "+44 7911 123456",
                "upi_id": "reliefcare.help@paytm",
                "website_url": "http://instagram-meta-appeal-desk.online",
                "profile_url": "https://instagram.com/ananya_designs"
            },
            "financial_loss": 0.0,
            "priority": "High",
            "status": "Investigation in Progress",
            "officer": officer_docs[2], # Sub-Inspector Arjun Patel
            "evidence_item": {
                "file_id": g_id3,
                "filename": "extortion_chat_evidence.txt",
                "content_type": "text/plain",
                "size": size3,
                "sha256": sha3,
                "type": "Chat Log",
                "desc": "Screenshots of extortion messages and original account recovery notification"
            },
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[2]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Citizen reported hijacked social media account with malicious solicitation.",
                    "timestamp": now - timedelta(days=8)
                },
                {
                    "stage": "ASSIGNMENT",
                    "action": f"Assigned to {officer_docs[2]['user_info']['full_name']} ({officer_docs[2]['badge_number']})",
                    "status": "Assigned",
                    "performed_by_name": admin_user["full_name"],
                    "performed_by_role": "admin",
                    "notes": "Assigned to Social Media Crimes Division.",
                    "timestamp": now - timedelta(days=7)
                },
                {
                    "stage": "STATUS_UPDATE",
                    "action": "Investigation in Progress",
                    "status": "Investigation in Progress",
                    "performed_by_name": officer_docs[2]['user_info']['full_name'],
                    "performed_by_role": "officer",
                    "notes": "Meta Law Enforcement Online Request submitted to lock compromised profile.",
                    "timestamp": now - timedelta(days=5)
                }
            ],
            "investigation_note": {
                "activity_type": "IP_TRACE",
                "title": "Meta LERS Subpoena & Account Secure Lock",
                "details": "Submitted emergency preservation and restoration request to Meta India Law Enforcement desk.",
                "findings": "Login originated from IP in Lagos, Nigeria via residential VPN proxy.",
                "action_taken": "Meta disabled malicious session and verified complainant identity.",
                "next_steps": "Complainant given recovery link to restore original credentials."
            }
        },
        {
            "complaint_id": "CC-202610-3841",
            "citizen": citizen_users[0],
            "category": "Identity Theft",
            "incident_date": now - timedelta(days=3),
            "incident_time": "11:00 IST",
            "location": "Bengaluru / Credit Bureau",
            "description": "Discovered an unfamiliar personal loan inquiry and outstanding loan of INR 45,000 on my CIBIL credit report from an instant loan app named 'RupeeQuick'. I never applied for this loan. Suspect my Aadhaar card photocopy submitted at a local telecom store was misused.",
            "suspect": {
                "name": "RupeeQuick Lending App / Telemarketer",
                "phone": "+91 91234 56780",
                "bank_account": "Equitas Small Finance Bank - 9028192841"
            },
            "financial_loss": 45000.0,
            "priority": "High",
            "status": "Under Review",
            "officer": None,
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[0]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Complaint filed with CIBIL credit report excerpt.",
                    "timestamp": now - timedelta(days=3)
                },
                {
                    "stage": "STATUS_UPDATE",
                    "action": "Marked Under Review",
                    "status": "Under Review",
                    "performed_by_name": admin_user["full_name"],
                    "performed_by_role": "admin",
                    "notes": "Identity theft team reviewing KYC records with UIDAI and NBFC.",
                    "timestamp": now - timedelta(days=2)
                }
            ]
        },
        {
            "complaint_id": "CC-202610-9102",
            "citizen": citizen_users[1],
            "category": "Fake Websites",
            "incident_date": now - timedelta(days=1),
            "incident_time": "16:20 IST",
            "location": "Online / Mumbai",
            "description": "Ordered a luxury handbag worth INR 12,500 from an advertisement on Facebook leading to a site 'www.luxe-brand-sale.shop'. Paid via debit card. No confirmation email or dispatch notification received. Site domain is now offline and customer care number is switched off.",
            "suspect": {
                "name": "LuxeBrand Online Ventures",
                "website_url": "https://www.luxe-brand-sale.shop",
                "bank_account": "HDFC Bank - 501002938192"
            },
            "financial_loss": 12500.0,
            "priority": "Medium",
            "status": "Submitted",
            "officer": None,
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[1]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Newly filed complaint awaiting administrative triage and officer assignment.",
                    "timestamp": now - timedelta(days=1)
                }
            ]
        },
        {
            "complaint_id": "CC-202610-1092",
            "citizen": citizen_users[2],
            "category": "Online Financial Fraud",
            "incident_date": now - timedelta(days=20),
            "incident_time": "18:00 IST",
            "location": "Pune",
            "description": "Purchased customized modular furniture from a registered local supplier through their website. Delivery has been delayed by 30 days and seller is refusing an immediate refund.",
            "suspect": {
                "name": "DecorCraft Modular Solutions Ltd",
                "phone": "+91 94220 11223"
            },
            "financial_loss": 35000.0,
            "priority": "Low",
            "status": "Rejected",
            "rejection_reason": "Matter pertains to a commercial contractual dispute with a registered entity and deficiency of service. This falls under Consumer Protection Forum jurisdiction, not criminal cyber offence.",
            "officer": officer_docs[0],
            "history": [
                {
                    "stage": "SUBMISSION",
                    "action": "Complaint Lodged",
                    "status": "Submitted",
                    "performed_by_name": citizen_users[2]["full_name"],
                    "performed_by_role": "citizen",
                    "notes": "Complaint filed.",
                    "timestamp": now - timedelta(days=20)
                },
                {
                    "stage": "STATUS_UPDATE",
                    "action": "Complaint Rejected with Reason",
                    "status": "Rejected",
                    "performed_by_name": officer_docs[0]['user_info']['full_name'],
                    "performed_by_role": "officer",
                    "notes": "Commercial dispute outside cyber jurisdiction. Complainant advised to approach District Consumer Disputes Redressal Forum.",
                    "timestamp": now - timedelta(days=18)
                }
            ]
        }
    ]

    for comp in complaints_seed_data:
        c_id = ObjectId()
        evidence_ids = []

        # If evidence attached
        if "evidence_item" in comp:
            e_item = comp["evidence_item"]
            ev_id = ObjectId()
            ev_doc = {
                "_id": ev_id,
                "complaint_id": c_id,
                "file_id": e_item["file_id"],
                "filename": f"{e_item['file_id']}_{e_item['filename']}",
                "original_name": e_item["filename"],
                "content_type": e_item["content_type"],
                "file_size": e_item["size"],
                "evidence_type": e_item["type"],
                "description": e_item["desc"],
                "uploaded_by": comp["citizen"]["_id"],
                "sha256_hash": e_item["sha256"],
                "created_at": comp["incident_date"]
            }
            db.evidence.insert_one(ev_doc)
            evidence_ids.append(ev_id)

        # Build complaint document
        off = comp.get("officer")
        complaint_doc = {
            "_id": c_id,
            "complaint_id": comp["complaint_id"],
            "citizen_id": comp["citizen"]["_id"],
            "citizen_name": comp["citizen"]["full_name"],
            "citizen_email": comp["citizen"]["email"],
            "citizen_phone": comp["citizen"]["phone"],
            "category": comp["category"],
            "incident_date": comp["incident_date"],
            "incident_time": comp["incident_time"],
            "incident_location": comp["location"],
            "description": comp["description"],
            "suspect_info": comp.get("suspect", {}),
            "financial_loss": comp.get("financial_loss", 0.0),
            "priority": comp["priority"],
            "status": comp["status"],
            "assigned_officer_id": off["_id"] if off else None,
            "assigned_officer_name": off["user_info"]["full_name"] if off else None,
            "assigned_officer_badge": off["badge_number"] if off else None,
            "evidence_ids": evidence_ids,
            "rejection_reason": comp.get("rejection_reason"),
            "resolution_summary": comp.get("resolution_summary"),
            "investigation_history": comp["history"],
            "created_at": comp["incident_date"],
            "updated_at": now
        }
        db.complaints.insert_one(complaint_doc)

        # Update officer workload counters if assigned
        if off:
            if comp["status"] in ["Resolved", "Closed"]:
                db.officers.update_one({"_id": off["_id"]}, {"$inc": {"resolved_cases_count": 1}})
            else:
                db.officers.update_one({"_id": off["_id"]}, {"$inc": {"active_cases_count": 1}})

        # Add investigation note if present
        if "investigation_note" in comp and off:
            i_note = comp["investigation_note"]
            inv_doc = {
                "complaint_id": c_id,
                "complaint_number": comp["complaint_id"],
                "officer_user_id": off["user_id"],
                "officer_name": off["user_info"]["full_name"],
                "officer_badge": off["badge_number"],
                "activity_type": i_note["activity_type"],
                "title": i_note["title"],
                "details": i_note["details"],
                "findings": i_note["findings"],
                "action_taken": i_note["action_taken"],
                "next_steps": i_note["next_steps"],
                "created_at": comp["incident_date"] + timedelta(days=2)
            }
            db.investigations.insert_one(inv_doc)

        # Seed notification to citizen
        db.notifications.insert_one({
            "recipient_id": comp["citizen"]["_id"],
            "title": f"Complaint Status: {comp['status']}",
            "message": f"Your complaint {comp['complaint_id']} regarding {comp['category']} is currently marked as {comp['status']}.",
            "type": "STATUS_UPDATE",
            "complaint_id": comp["complaint_id"],
            "is_read": False,
            "created_at": now - timedelta(hours=5)
        })

    print(f"  [OK] Seeded {len(complaints_seed_data)} realistic complaints with GridFS evidence & timelines.")

    # 5. SEED AUDIT LOGS
    sample_audit_logs = [
        {
            "user_id": admin_id,
            "user_email": "admin@cybercell.gov.in",
            "user_role": "admin",
            "action": "SYSTEM_INITIALIZATION",
            "target_entity": "system",
            "target_id": "CYBER_CORE_INIT",
            "ip_address": "10.0.4.1",
            "user_agent": "CyberCommand/ForensicTerminal-Linux",
            "details": {"action": "Database seeded with demonstration records and encryption keys verified."},
            "timestamp": now - timedelta(hours=48)
        },
        {
            "user_id": admin_id,
            "user_email": "admin@cybercell.gov.in",
            "user_role": "admin",
            "action": "OFFICER_ASSIGNED",
            "target_entity": "complaint",
            "target_id": "CC-202610-8491",
            "ip_address": "10.0.4.1",
            "user_agent": "CyberCommand/WebAdmin",
            "details": {"assigned_to": "Inspector Vikrant Sharma", "badge": "CYBER-OFF-001"},
            "timestamp": now - timedelta(hours=24)
        },
        {
            "user_id": officer_docs[0]["user_id"],
            "user_email": "officer.sharma@cybercell.gov.in",
            "user_role": "officer",
            "action": "INVESTIGATION_NOTE_ADDED",
            "target_entity": "investigation",
            "target_id": "CC-202610-8491",
            "ip_address": "10.0.4.18",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "details": {"title": "Immediate Freeze Request for Beneficiary UPI Handle"},
            "timestamp": now - timedelta(hours=12)
        }
    ]
    db.audit_logs.insert_many(sample_audit_logs)
    print(f"  [OK] Seeded initial security audit logs.")

    print("==================================================================")
    print("DEMO CREDENTIALS FOR TESTING:")
    print("  Administrator:        admin@cybercell.gov.in          / Admin@123")
    print("  Investigation Officer: officer.sharma@cybercell.gov.in / Officer@123")
    print("  Investigation Officer: officer.verma@cybercell.gov.in  / Officer@123")
    print("  Registered Citizen:   rahul.mehta@gmail.com           / Citizen@123")
    print("  Registered Citizen:   priya.sharma@gmail.com          / Citizen@123")
    print("==================================================================")
    print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")

if __name__ == '__main__':
    seed_database()
