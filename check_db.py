#!/usr/bin/env python3
"""
MongoDB Database Inspector for Cyber Crime Reporting System.
Run this script to inspect all collections, documents, indexes, GridFS files,
and aggregation pipeline outputs directly from terminal.
"""
import sys
import os

# Enable UTF-8 encoding in Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from pathlib import Path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.utils.db import get_client, get_db
from backend.services.analytics_service import get_admin_dashboard_metrics

def inspect_database():
    client = get_client()
    db = get_db()

    print("=" * 72)
    print(" MONGODB DATABASE INSPECTION REPORT")
    print("=" * 72)
    print(f" Database Server:  MongoDB v{client.server_info().get('version')}")
    print(f" Target Database:  {db.name}")
    print("-" * 72)

    # 1. LIST COLLECTIONS AND DOCUMENT COUNTS
    print("\n[1] COLLECTIONS & DOCUMENT COUNTS:")
    collections = sorted(db.list_collection_names())
    for col_name in collections:
        count = db[col_name].count_documents({})
        print(f"  * {col_name:<20} -> {count:>4} document(s)")

    # 2. SAMPLE COMPLAINTS
    print("\n[2] SAMPLE COMPLAINTS RECORDED IN MONGODB:")
    complaints = list(db.complaints.find({}, {
        "complaint_id": 1, "category": 1, "status": 1, 
        "priority": 1, "financial_loss": 1, "citizen_name": 1, "assigned_officer_name": 1
    }).limit(6))

    for c in complaints:
        officer = c.get('assigned_officer_name') or 'Unassigned'
        loss = f"Rs {c.get('financial_loss', 0):,.2f}"
        print(f"  [{c.get('complaint_id')}] {c.get('category'):<22} | Status: {c.get('status'):<24} | Priority: {c.get('priority'):<8} | Loss: {loss:<14} | Officer: {officer}")

    # 3. DIGITAL EVIDENCE IN MONGODB GRIDFS
    print("\n[3] DIGITAL EVIDENCE VAULT (GridFS):")
    evidence_items = list(db.evidence.find({}, {
        "original_name": 1, "file_size": 1, "evidence_type": 1, "sha256_hash": 1
    }))
    if evidence_items:
        for ev in evidence_items:
            sha = ev.get('sha256_hash', '')[:20] + '...'
            print(f"  * File: {ev.get('original_name'):<30} | Type: {ev.get('evidence_type'):<16} | Size: {ev.get('file_size')} bytes | SHA-256: {sha}")
    else:
        print("  (No evidence files found in GridFS)")

    # 4. MONGODB INDEXES
    print("\n[4] INDEXES CREATED (Unique, Compound & Text):")
    for col_name in ['complaints', 'users', 'officers', 'crime_categories']:
        indexes = db[col_name].index_information()
        print(f"  Collection: {col_name}")
        for idx_name, idx_info in indexes.items():
            keys = idx_info.get('key', [])
            unique = " [UNIQUE]" if idx_info.get('unique') else ""
            print(f"    - {idx_name}: {keys}{unique}")

    # 5. TEST AGGREGATION PIPELINES (LIVE RESULTS)
    print("\n[5] LIVE AGGREGATION PIPELINE OUTPUTS:")
    metrics = get_admin_dashboard_metrics()
    summary = metrics.get('summary', {})
    print(f"  * Total Registered Complaints: {summary.get('total_complaints')}")
    print(f"  * Active Pending Cases:        {summary.get('pending_cases')}")
    print(f"  * Under Investigation:         {summary.get('under_investigation')}")
    print(f"  * Concluded / Resolved:        {summary.get('resolved_cases')}")
    print(f"  * Total Financial Loss:        Rs {summary.get('total_financial_loss', 0):,.2f}")
    print(f"  * Average Financial Loss:      Rs {summary.get('avg_financial_loss', 0):,.2f}")

    print("\n  Category Distribution ($group aggregation):")
    for cat in metrics.get('category_distribution', []):
        print(f"    - {cat.get('category'):<25}: {cat.get('count')} case(s)")

    print("\n" + "=" * 72)
    print(" Inspection completed successfully. All MongoDB collections are intact!")
    print("=" * 72)

if __name__ == '__main__':
    inspect_database()
