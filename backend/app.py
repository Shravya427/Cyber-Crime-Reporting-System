import os
import sys
from pathlib import Path

# Add project root to sys.path so backend modules import properly
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from backend.config import Config
from backend.utils.db import get_db, check_replica_set
from backend.routes.auth_routes import auth_bp
from backend.routes.complaint_routes import complaint_bp
from backend.routes.evidence_routes import evidence_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.notification_routes import notification_bp
from backend.routes.analytics_routes import analytics_bp

def create_app():
    dist_dir = project_root / 'frontend' / 'dist'
    static_folder = str(dist_dir) if dist_dir.exists() else None

    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    app.config.from_object(Config)

    # Enable CORS for all origins in development or configured FRONTEND_URL
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Ensure uploads folder exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(evidence_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(analytics_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
            db = get_db()
            db.command('ping')
            has_replica = check_replica_set()
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "mongodb_version": db.client.server_info().get('version'),
                "replica_set": has_replica,
                "project": "Cyber Crime Reporting and Investigation Management System"
            }), 200
        except Exception as e:
            return jsonify({
                "status": "degraded",
                "database_error": str(e)
            }), 500

    # Serve Built Frontend SPA if dist folder exists
    if static_folder and os.path.exists(static_folder):
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_spa(path):
            if path and path.startswith('api'):
                return jsonify({"error": "Endpoint not found"}), 404
            file_path = dist_dir / path
            if path and file_path.exists():
                return send_from_directory(static_folder, path)
            return send_from_directory(static_folder, 'index.html')

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({
            "success": False,
            "error": "File size exceeds the 16MB limit."
        }), 413

    @app.errorhandler(404)
    def not_found(error):
        if request.path.startswith('/api/'):
            return jsonify({
                "success": False,
                "error": "API endpoint not found."
            }), 404
        if static_folder and os.path.exists(static_folder):
            return send_from_directory(static_folder, 'index.html')
        return jsonify({"error": "Page not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "success": False,
            "error": "Internal server error occurred."
        }), 500

    return app

if __name__ == '__main__':
    app = create_app()
    print(f"Starting Cyber Crime Backend on port {Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
