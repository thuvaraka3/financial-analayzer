from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..analytics.engine import AnalyticsEngine
from ..analytics.forecasting import FinancialForecaster
from ..analytics.anomaly_detection import AnomalyDetector
from ..ai.service_manager import AIServiceManager
from ..services.firestore_service import FirestoreService

analytics_bp = Blueprint('analytics', __name__)
engine = AnalyticsEngine()
forecaster = FinancialForecaster()
detector = AnomalyDetector()
ai_manager = AIServiceManager()
db = FirestoreService()

@analytics_bp.route('/spending', methods=['GET'])
@jwt_required()
def spending_analysis():
    user_id = get_jwt_identity()
    period = request.args.get('period', 'monthly')
    result = engine.get_spending_analysis(user_id, period)
    return jsonify(result), 200

@analytics_bp.route('/income', methods=['GET'])
@jwt_required()
def income_analysis():
    user_id = get_jwt_identity()
    result = engine.get_income_analysis(user_id)
    return jsonify(result), 200

@analytics_bp.route('/savings', methods=['GET'])
@jwt_required()
def savings_analysis():
    user_id = get_jwt_identity()
    result = engine.get_savings_analysis(user_id)
    return jsonify(result), 200

@analytics_bp.route('/budget', methods=['GET'])
@jwt_required()
def budget_analysis():
    user_id = get_jwt_identity()
    result = engine.get_budget_analysis(user_id)
    return jsonify(result), 200

@analytics_bp.route('/forecast', methods=['GET'])
@jwt_required()
def forecast():
    user_id = get_jwt_identity()
    periods = request.args.get('periods', 3, type=int)
    expense_forecast = forecaster.forecast_expenses(user_id, periods)
    savings_forecast = forecaster.forecast_savings(user_id, periods)
    overrun_risk = forecaster.detect_budget_overrun_risk(user_id)

    return jsonify({
        'expenseForecast': expense_forecast,
        'savingsForecast': savings_forecast,
        'budgetOverrunRisk': overrun_risk
    }), 200

@analytics_bp.route('/anomalies', methods=['GET'])
@jwt_required()
def anomalies():
    user_id = get_jwt_identity()
    result = detector.detect_anomalies(user_id)
    return jsonify(result), 200

@analytics_bp.route('/health', methods=['GET'])
@jwt_required()
def health_score():
    user_id = get_jwt_identity()
    result = engine.get_health_score(user_id)
    return jsonify(result), 200

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()

    transactions = db.get_all_transactions(user_id)

    total_income = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'income')
    total_expenses = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'expense')
    total_savings = total_income - total_expenses

    from datetime import datetime
    now = datetime.utcnow()
    current_month_tx = [t for t in transactions if t.get('date', '').startswith(now.strftime('%Y-%m'))]
    monthly_income = sum(float(t.get('amount', 0)) for t in current_month_tx if t.get('type') == 'income')
    monthly_expenses = sum(float(t.get('amount', 0)) for t in current_month_tx if t.get('type') == 'expense')
    monthly_savings = monthly_income - monthly_expenses

    expense_tx = [t for t in transactions if t.get('type') == 'expense']
    category_data = {}
    for t in expense_tx:
        cat = t.get('category', 'Other')
        category_data[cat] = category_data.get(cat, 0) + float(t.get('amount', 0))

    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    chart_data = []
    for m in range(1, now.month + 1):
        month_str = f'{now.year}-{m:02d}'
        month_tx = [t for t in transactions if t.get('date', '').startswith(month_str)]
        inc = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'income')
        exp = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'expense')
        chart_data.append({'month': months[m - 1], 'income': inc, 'expenses': exp})

    recent = sorted(transactions, key=lambda t: t.get('date', ''), reverse=True)[:5]

    health = engine.get_health_score(user_id)

    return jsonify({
        'totalBalance': round(total_savings, 2),
        'totalIncome': round(total_income, 2),
        'totalExpenses': round(total_expenses, 2),
        'monthlyIncome': round(monthly_income, 2),
        'monthlyExpenses': round(monthly_expenses, 2),
        'monthlySavings': round(monthly_savings, 2),
        'chartData': chart_data,
        'categoryData': [{'name': k, 'value': round(v, 2)} for k, v in category_data.items()],
        'recentTransactions': recent,
        'healthScore': health
    }), 200
