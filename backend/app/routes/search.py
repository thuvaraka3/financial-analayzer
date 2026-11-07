from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService

search_bp = Blueprint('search', __name__)
db = FirestoreService()

MAX_RESULTS = 20


@search_bp.route('', methods=['GET'])
@jwt_required()
def search():
    user_id = get_jwt_identity()
    query = (request.args.get('q') or '').strip().lower()

    if len(query) < 2:
        return jsonify({'query': query, 'results': [], 'count': 0}), 200

    results = []

    for tx in db.get_all_transactions(user_id):
        haystack = ' '.join(str(tx.get(field, '')) for field in (
            'description', 'category', 'type', 'amount', 'date'
        )).lower()
        if query in haystack:
            amount = float(tx.get('amount') or 0)
            results.append({
                'type': 'transaction',
                'id': tx.get('transactionId') or tx.get('id'),
                'title': tx.get('description') or tx.get('category') or 'Transaction',
                'subtitle': f"{tx.get('category', '')} · LKR {amount:,.0f} · {tx.get('date', '')}",
                'page': 'transactions',
            })

    for budget in db.get_budgets(user_id):
        haystack = ' '.join(str(budget.get(field, '')) for field in (
            'category', 'monthlyLimit'
        )).lower()
        if query in haystack:
            limit = float(budget.get('monthlyLimit') or 0)
            results.append({
                'type': 'budget',
                'id': budget.get('budgetId') or budget.get('id'),
                'title': f"{budget.get('category') or 'Overall'} budget",
                'subtitle': f'LKR {limit:,.0f} monthly limit',
                'page': 'budgets',
            })

    for goal in db.get_goals(user_id):
        haystack = ' '.join(str(goal.get(field, '')) for field in (
            'goalName', 'targetAmount', 'currentAmount', 'deadline'
        )).lower()
        if query in haystack:
            target = float(goal.get('targetAmount') or 0)
            current = float(goal.get('currentAmount') or 0)
            results.append({
                'type': 'goal',
                'id': goal.get('goalId') or goal.get('id'),
                'title': goal.get('goalName') or 'Savings goal',
                'subtitle': f'LKR {current:,.0f} of LKR {target:,.0f}',
                'page': 'goals',
            })

    results = results[:MAX_RESULTS]

    return jsonify({'query': query, 'results': results, 'count': len(results)}), 200
