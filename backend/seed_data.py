"""Seed random demo data for a user so every feature can be exercised.

Usage:
    python seed_data.py
    python seed_data.py --email someone@example.com
    python seed_data.py --clear

Seeded documents are tagged with seeded=True. Re-running replaces the demo
data for that user without touching their existing documents.
"""

import argparse
import os
import random
from datetime import datetime, timedelta

from dotenv import load_dotenv

load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore


def get_db():
    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    return firestore.client()


EXPENSE_OPTIONS = [
    ('Food', 'Groceries', 800, 3500),
    ('Food', 'Restaurant', 900, 4000),
    ('Transport', 'Fuel', 1500, 5000),
    ('Transport', 'Taxi', 400, 2200),
    ('Bills', 'Electricity bill', 2500, 7000),
    ('Bills', 'Internet bill', 2000, 4500),
    ('Shopping', 'Clothing', 1000, 9000),
    ('Shopping', 'Electronics', 2500, 15000),
    ('Entertainment', 'Movie night', 800, 4500),
    ('Healthcare', 'Pharmacy', 500, 3500),
    ('Education', 'Online course', 1500, 8000),
    ('Housing', 'Monthly rent', 22000, 32000),
    ('Other', 'Miscellaneous', 500, 3000),
]

ANOMALY_OPTIONS = [
    ('Shopping', 'New smartphone', 65000, 95000),
    ('Shopping', 'Festival shopping spree', 55000, 80000),
    ('Entertainment', 'Concert tickets', 30000, 45000),
]


def month_starts(months):
    today = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    starts = []
    for offset in range(months - 1, -1, -1):
        year = today.year
        month = today.month - offset
        while month <= 0:
            month += 12
            year -= 1
        starts.append(datetime(year, month, 1))
    return starts


def random_date_in_month(start, is_current_month):
    today = datetime.utcnow()
    if is_current_month:
        max_day = max(1, (today - start).days)
    else:
        next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        max_day = (next_month - start).days
    day = random.randint(1, max_day)
    return (start + timedelta(days=day - 1)).strftime('%Y-%m-%d')


def bulk_delete(collection, user_id):
    docs = [
        doc for doc in collection.where('userId', '==', user_id).stream()
        if (doc.to_dict() or {}).get('seeded')
    ]
    for doc in docs:
        doc.reference.delete()
    return len(docs)


def seed(db, user_id, months=4):
    transactions = db.collection('transactions')
    budgets = db.collection('budgets')
    goals = db.collection('savingsGoals')

    removed = (
        bulk_delete(transactions, user_id)
        + bulk_delete(budgets, user_id)
        + bulk_delete(goals, user_id)
    )
    if removed:
        print(f'Removed {removed} previously seeded documents.')

    now_iso = datetime.utcnow().isoformat()
    tx_count = 0

    for index, start in enumerate(month_starts(months)):
        is_current = index == months - 1
        month_key = start.strftime('%Y-%m')

        # Salary income
        salary = round(random.uniform(180000, 240000), 2)
        doc = transactions.document()
        doc.set({
            'transactionId': doc.id,
            'userId': user_id,
            'type': 'income',
            'category': 'Salary',
            'amount': salary,
            'date': (start + timedelta(days=random.randint(0, 2))).strftime('%Y-%m-%d'),
            'description': f'Monthly salary {month_key}',
            'createdAt': now_iso,
            'seeded': True,
        })
        tx_count += 1

        # Occasional freelance income
        if random.random() < 0.6:
            doc = transactions.document()
            amount = round(random.uniform(15000, 45000), 2)
            doc.set({
                'transactionId': doc.id,
                'userId': user_id,
                'type': 'income',
                'category': 'Freelancing',
                'amount': amount,
                'date': random_date_in_month(start, is_current),
                'description': 'Freelance project payment',
                'createdAt': now_iso,
                'seeded': True,
            })
            tx_count += 1

        # Regular expenses
        for _ in range(random.randint(10, 14)):
            category, desc, low, high = random.choice(EXPENSE_OPTIONS)
            amount = round(random.uniform(low, high), 2)
            doc = transactions.document()
            doc.set({
                'transactionId': doc.id,
                'userId': user_id,
                'type': 'expense',
                'category': category,
                'amount': amount,
                'date': random_date_in_month(start, is_current),
                'description': desc,
                'createdAt': now_iso,
                'seeded': True,
            })
            tx_count += 1

        # A large anomalous expense in the latest two months
        if index >= months - 2:
            category, desc, low, high = random.choice(ANOMALY_OPTIONS)
            doc = transactions.document()
            doc.set({
                'transactionId': doc.id,
                'userId': user_id,
                'type': 'expense',
                'category': category,
                'amount': round(random.uniform(low, high), 2),
                'date': random_date_in_month(start, is_current),
                'description': desc,
                'createdAt': now_iso,
                'seeded': True,
            })
            tx_count += 1

    # Budgets (sized so some are exceeded / near their limit)
    budget_rows = [
        ('Overall', 50000),
        ('Food', 10000),
        ('Transport', 10000),
        ('Bills', 8000),
        ('Shopping', 8000),
        ('Entertainment', 5000),
    ]
    for category, limit in budget_rows:
        doc = budgets.document()
        doc.set({
            'budgetId': doc.id,
            'userId': user_id,
            'category': category,
            'monthlyLimit': float(limit),
            'createdAt': now_iso,
            'seeded': True,
        })

    # Goals: achieved, approaching, overdue and untouched
    today = datetime.utcnow()
    goal_rows = [
        ('Emergency Fund', 500000, 220000, (today + timedelta(days=150)).strftime('%Y-%m-%d')),
        ('Vacation', 150000, 145000, (today + timedelta(days=15)).strftime('%Y-%m-%d')),
        ('New Laptop', 300000, 300000, (today + timedelta(days=30)).strftime('%Y-%m-%d')),
        ('Gym Membership', 20000, 0, (today - timedelta(days=10)).strftime('%Y-%m-%d')),
    ]
    for name, target, current, deadline in goal_rows:
        doc = goals.document()
        doc.set({
            'goalId': doc.id,
            'userId': user_id,
            'goalName': name,
            'targetAmount': float(target),
            'currentAmount': float(current),
            'deadline': deadline,
            'createdAt': now_iso,
            'seeded': True,
        })

    return tx_count, len(budget_rows), len(goal_rows)


def main():
    parser = argparse.ArgumentParser(description='Seed random demo data for a user.')
    parser.add_argument('--email', default='thuvaraka@gmail.com')
    parser.add_argument('--months', type=int, default=4)
    parser.add_argument('--clear', action='store_true', help='Only remove seeded demo data')
    args = parser.parse_args()

    db = get_db()

    users = list(db.collection('users').where('email', '==', args.email).limit(1).stream())
    if not users:
        raise SystemExit(f'No user found with email {args.email}')

    user_id = users[0].id
    print(f'Seeding data for {args.email} ({user_id})')

    if args.clear:
        removed = (
            bulk_delete(db.collection('transactions'), user_id)
            + bulk_delete(db.collection('budgets'), user_id)
            + bulk_delete(db.collection('savingsGoals'), user_id)
        )
        print(f'Removed {removed} seeded documents.')
        return

    random.seed(42)
    tx_count, budget_count, goal_count = seed(db, user_id, months=max(1, args.months))
    print(f'Added {tx_count} transactions, {budget_count} budgets and {goal_count} goals.')


if __name__ == '__main__':
    main()
