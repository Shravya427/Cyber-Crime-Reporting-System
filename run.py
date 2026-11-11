#!/usr/bin/env python3
"""
Quickstart launcher for the Cyber Crime Reporting and Investigation Management System.
Runs the database seeder (if needed) and launches the application.
"""
import sys
import os
import webbrowser
import threading
import time
from pathlib import Path

project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

from backend.config import Config
from backend.utils.db import get_db
from backend.app import create_app

def ensure_seeded():
    try:
        db = get_db()
        count = db.complaints.count_documents({})
        if count == 0:
            print("[INFO] Database empty. Seeding initial demonstration data...")
            from database.seed_data import seed_database
            seed_database()
        else:
            print(f"[OK] MongoDB connected. Found {count} existing complaint records.")
    except Exception as e:
        print(f"[WARN] Database verification notice: {e}")

def open_browser():
    time.sleep(1.5)
    url = f"http://localhost:{Config.PORT}"
    print(f"\n[READY] Launching portal in browser: {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == '__main__':
    print("=" * 68)
    print(" CYBER CRIME REPORTING & INVESTIGATION MANAGEMENT SYSTEM")
    print("=" * 68)

    ensure_seeded()

    # Launch browser after slight delay
    threading.Thread(target=open_browser, daemon=True).start()

    app = create_app()
    print(f"[SERVER] Starting unified web server on http://localhost:{Config.PORT}...")
    print("Press Ctrl+C to terminate the server.\n")
    app.run(host='0.0.0.0', port=Config.PORT, debug=False)
