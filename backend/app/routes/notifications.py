from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService

notifications_bp = Blueprint('notifications', __name__)
db = FirestoreService()

SEVERITY_ORDER = {'high': 0, 'medium': 1, 'success': 2, 'low': 3}


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    transactions = db.get_all_transactions(user_id)
    budgets = db.get_budgets(user_id)
    goals = db.get_goals(user_id)

    now = datetime.utcnow()
    today = now.strftime('%Y-%m-%d')
    month_prefix = now.strftime('%Y-%m')
    created_at = now.isoformat()

    expenses = [t for t in transactions if t.get('type') == 'expense']
    month_expenses = [t for t in expenses if (t.get('date') or '')[:7] == month_prefix]

    notifications = []

    def add(notification):
        notifications.append(notification)

    # Budget alerts
    for budget in budgets:
        category = budget.get('category') or 'Overall'
        limit = float(budget.get('monthlyLimit') or 0)
        if limit <= 0:
            continue
        if category == 'Overall':
            spent = sum(float(t.get('amount') or 0) for t in month_expenses)
        else:
            spent = sum(
                float(t.get('amount') or 0)
                for t in month_expenses
                if t.get('category') == category
            )
        percentage = (spent / limit) * 100
        budget_id = budget.get('budgetId') or budget.get('id')

        if percentage >= 100:
            add({
                'id': f'budget-{budget_id}',
                'type': 'budgetAlerts',
                'severity': 'high',
                'title': f'{category} budget exceeded',
                'message': f'You spent LKR {spent:,.0f} of your LKR {limit:,.0f} limit ({percentage:.0f}%).',
                'page': 'budgets',
                'createdAt': created_at,
            })
        elif percentage >= 80:
            add({
                'id': f'budget-{budget_id}',
                'type': 'budgetAlerts',
                'severity': 'medium',
                'title': f'{category} budget almost used',
                'message': f'You have used {percentage:.0f}% of your LKR {limit:,.0f} limit.',
                'page': 'budgets',
                'createdAt': created_at,
            })

    # Goal reminders
    for goal in goals:
        target = float(goal.get('targetAmount') or 0)
        current = float(goal.get('currentAmount') or 0)
        if target <= 0:
            continue
        goal_id = goal.get('goalId') or goal.get('id')
        name = goal.get('goalName') or 'Savings goal'
        progress = (current / target) * 100

        if progress >= 100:
            add({
                'id': f'goal-{goal_id}',
                'type': 'goalReminders',
                'severity': 'success',
                'title': f'Goal achieved: {name}',
                'message': f'You reached LKR {current:,.0f} of your LKR {target:,.0f} target.',
                'page': 'goals',
                'createdAt': created_at,
            })
            continue

        deadline = goal.get('deadline')
        if deadline:
            try:
                deadline_date = datetime.strptime(str(deadline)[:10], '%Y-%m-%d')
            except ValueError:
                deadline_date = None
            if deadline_date is not None:
                days_left = (deadline_date - now).days
                if days_left < 0:
                    add({
                        'id': f'goal-{goal_id}',
                        'type': 'goalReminders',
                        'severity': 'high',
                        'title': f'Goal overdue: {name}',
                        'message': f'The deadline passed {abs(days_left)} days ago. You are at {progress:.0f}%.',
                        'page': 'goals',
                        'createdAt': created_at,
                    })
                elif days_left <= 30:
                    add({
                        'id': f'goal-{goal_id}',
                        'type': 'goalReminders',
                        'severity': 'medium',
                        'title': f'Goal deadline approaching: {name}',
                        'message': f'{days_left} days left and you are at {progress:.0f}% of your target.',
                        'page': 'goals',
                        'createdAt': created_at,
                    })

        last_amount = goal.get('lastProgressAt') or goal.get('updatedAt')
        if not last_amount and current == 0:
            add({
                'id': f'goal-{goal_id}-reminder',
                'type': 'goalReminders',
                'severity': 'low',
                'title': f'Start saving for {name}',
                'message': f'You have not added any savings to this LKR {target:,.0f} goal yet.',
                'page': 'goals',
                'createdAt': created_at,
            })

    # Weekly summary
    week_ago = (now - timedelta(days=7)).strftime('%Y-%m-%d')
    week_expenses = [
        t for t in expenses if today >= (t.get('date') or '') >= week_ago
    ]
    if week_expenses:
        week_total = sum(float(t.get('amount') or 0) for t in week_expenses)
        add({
            'id': f'weekly-summary-{now.strftime("%Y-%W")}',
            'type': 'weeklySummary',
            'severity': 'low',
            'title': 'Weekly spending summary',
            'message': f'You spent LKR {week_total:,.0f} across {len(week_expenses)} transactions in the last 7 days.',
            'page': 'analytics',
            'createdAt': created_at,
        })

    notifications.sort(key=lambda n: SEVERITY_ORDER.get(n.get('severity'), 9))

    return jsonify({
        'notifications': notifications,
        'count': len(notifications),
    }), 200
