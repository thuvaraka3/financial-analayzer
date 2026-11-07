import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object('config.Config')

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)

    from .routes.auth import auth_bp
    from .routes.transactions import transactions_bp
    from .routes.budgets import budgets_bp
    from .routes.goals import goals_bp
    from .routes.analytics import analytics_bp
    from .routes.chat import chat_bp
    from .routes.receipts import receipts_bp
    from .routes.reports import reports_bp
    from .routes.notifications import notifications_bp
    from .routes.search import search_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(receipts_bp, url_prefix='/api/receipts')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(search_bp, url_prefix='/api/search')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'FinSightAI Backend is running'}

    # Serve built frontend
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, 'index.html')

    return app
