from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService
from ..ai.service_manager import AIServiceManager

reports_bp = Blueprint('reports', __name__)
db = FirestoreService()
ai_manager = AIServiceManager()

@reports_bp.route('/monthly', methods=['GET'])
@jwt_required()
def get_monthly_report():
    user_id = get_jwt_identity()
    month = request.args.get('month', datetime.utcnow().strftime('%Y-%m'))

    existing = db.get_report_by_month(user_id, month)
    if existing:
        return jsonify({'report': existing}), 200

    return jsonify({'report': None, 'month': month}), 200

@reports_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_report():
    user_id = get_jwt_identity()
    data = request.get_json()
    month = data.get('month', datetime.utcnow().strftime('%Y-%m'))

    transactions = db.get_all_transactions(user_id)
    budgets = db.get_budgets(user_id)
    goals = db.get_goals(user_id)

    total_income = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'income')
    total_expenses = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'expense')
    savings = total_income - total_expenses
    savings_rate = (savings / total_income * 100) if total_income > 0 else 0

    month_tx = [t for t in transactions if t.get('date', '').startswith(month)]
    monthly_income = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'income')
    monthly_expenses = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'expense')

    category_data = {}
    for t in month_tx:
        if t.get('type') == 'expense':
            cat = t.get('category', 'Other')
            category_data[cat] = category_data.get(cat, 0) + float(t.get('amount', 0))

    financial_data = f"""
Monthly Financial Report - {month}
====================================
Income: LKR {monthly_income:,.2f}
Expenses: LKR {monthly_expenses:,.2f}
Savings: LKR {monthly_income - monthly_expenses:,.2f}
Savings Rate: {((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0:.1f}%

All-Time Totals:
Total Income: LKR {total_income:,.2f}
Total Expenses: LKR {total_expenses:,.2f}
Total Savings: LKR {savings:,.2f}
Overall Savings Rate: {savings_rate:.1f}%

Monthly Expenses by Category:
{chr(10).join(f'{cat}: LKR {amt:,.2f}' for cat, amt in sorted(category_data.items(), key=lambda x: x[1], reverse=True))}

Active Budgets: {len(budgets)}
Active Savings Goals: {len(goals)}
Total Transactions: {len(transactions)}
"""

    report_content, provider = ai_manager.generate_report(financial_data)

    if not report_content:
        report_content = f"""# Monthly Financial Report - {month}

## Summary
- Income: LKR {monthly_income:,.2f}
- Expenses: LKR {monthly_expenses:,.2f}
- Savings: LKR {monthly_income - monthly_expenses:,.2f}

## Categories
{chr(10).join(f'- {cat}: LKR {amt:,.2f}' for cat, amt in sorted(category_data.items(), key=lambda x: x[1], reverse=True))}
"""

    report = {
        'userId': user_id,
        'month': month,
        'reportContent': report_content,
        'provider': provider
    }

    existing = db.get_report_by_month(user_id, month)
    if existing:
        db.create_report(report)
    else:
        db.create_report(report)

    return jsonify({
        'message': 'Report generated successfully',
        'report': report,
        'financialData': financial_data
    }), 200

@reports_bp.route('/list', methods=['GET'])
@jwt_required()
def list_reports():
    user_id = get_jwt_identity()
    reports = db.get_reports(user_id)
    return jsonify({'reports': reports}), 200
