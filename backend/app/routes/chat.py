import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService
from ..ai.service_manager import AIServiceManager

chat_bp = Blueprint('chat', __name__)
db = FirestoreService()
ai_manager = AIServiceManager()

def build_financial_context(user_id):
    transactions = db.get_all_transactions(user_id)
    budgets = db.get_budgets(user_id)
    goals = db.get_goals(user_id)

    total_income = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'income')
    total_expenses = sum(float(t.get('amount', 0)) for t in transactions if t.get('type') == 'expense')
    savings = total_income - total_expenses

    from datetime import datetime
    now = datetime.utcnow()
    month_tx = [t for t in transactions if t.get('date', '').startswith(now.strftime('%Y-%m'))]
    monthly_income = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'income')
    monthly_expenses = sum(float(t.get('amount', 0)) for t in month_tx if t.get('type') == 'expense')

    category_spending = {}
    for t in transactions:
        if t.get('type') == 'expense':
            cat = t.get('category', 'Other')
            category_spending[cat] = category_spending.get(cat, 0) + float(t.get('amount', 0))

    context = f"""
Current Month: {now.strftime('%B %Y')}
Total Income (All Time): LKR {total_income:,.2f}
Total Expenses (All Time): LKR {total_expenses:,.2f}
Total Savings: LKR {savings:,.2f}
Monthly Income: LKR {monthly_income:,.2f}
Monthly Expenses: LKR {monthly_expenses:,.2f}
Transaction Count: {len(transactions)}

Top Spending Categories:
{chr(10).join(f'- {cat}: LKR {amt:,.2f}' for cat, amt in sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:5])}

Budgets: {len(budgets)} active
Savings Goals: {len(goals)} active
"""
    return context

@chat_bp.route('', methods=['POST'])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    context = build_financial_context(user_id)

    try:
        response, provider = ai_manager.chat(message, context)
    except Exception as e:
        response = "I'm having trouble processing your request. Please try again."
        provider = None

    db.add_chat_message({
        'userId': user_id,
        'message': message,
        'role': 'user',
        'provider': provider
    })
    db.add_chat_message({
        'userId': user_id,
        'message': response,
        'role': 'assistant',
        'provider': provider
    })

    return jsonify({
        'response': response,
        'provider': provider
    }), 200

@chat_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    history = db.get_chat_history(user_id)
    return jsonify({'history': history}), 200

@chat_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_insights():
    user_id = get_jwt_identity()
    context = build_financial_context(user_id)
    result, provider = ai_manager.generate_insights(context)
    return jsonify({'insights': result, 'provider': provider}), 200
