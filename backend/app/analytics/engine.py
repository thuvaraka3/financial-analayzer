import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ..services.firestore_service import FirestoreService

class AnalyticsEngine:
    def __init__(self):
        self.db = FirestoreService()

    def get_spending_analysis(self, user_id, period='monthly'):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return self._empty_response()

        df = pd.DataFrame(transactions)
        if df.empty:
            return self._empty_response()
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        expenses = df[df['type'] == 'expense'].copy()

        if expenses.empty:
            return self._empty_response()

        now = datetime.utcnow()
        if period == 'daily':
            mask = expenses['date'] >= now - timedelta(days=1)
        elif period == 'weekly':
            mask = expenses['date'] >= now - timedelta(weeks=1)
        elif period == 'yearly':
            mask = expenses['date'] >= now - timedelta(days=365)
        else:
            mask = expenses['date'] >= now - timedelta(days=30)

        filtered = expenses[mask].copy()
        if filtered.empty:
            filtered = expenses

        category_spending = filtered.groupby('category')['amount'].sum().sort_values(ascending=False)
        daily_spending = filtered.set_index('date').resample('D')['amount'].sum()
        monthly_spending = expenses.set_index('date').resample('ME')['amount'].sum()

        total = float(filtered['amount'].sum())
        avg_transaction = float(filtered['amount'].mean())
        transaction_count = len(filtered)

        return {
            'total': round(total, 2),
            'averagePerTransaction': round(avg_transaction, 2),
            'transactionCount': transaction_count,
            'categoryBreakdown': {
                str(k): round(float(v), 2) for k, v in category_spending.items()
            },
            'dailyTrend': {
                str(k.date()): round(float(v), 2) for k, v in daily_spending.items()
            },
            'monthlyTrend': {
                str(k.strftime('%Y-%m')): round(float(v), 2) for k, v in monthly_spending.items()
            },
            'highestCategory': str(category_spending.index[0]) if not category_spending.empty else None,
            'lowestCategory': str(category_spending.index[-1]) if len(category_spending) > 1 else None
        }

    def get_income_analysis(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return self._empty_response()

        df = pd.DataFrame(transactions)
        if df.empty:
            return self._empty_response()
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        incomes = df[df['type'] == 'income'].copy()
        if incomes.empty:
            return self._empty_response()

        monthly_income = incomes.set_index('date').resample('ME')['amount'].sum()
        source_breakdown = incomes.groupby('category')['amount'].sum().sort_values(ascending=False)

        growth = 0
        if len(monthly_income) >= 2:
            values = monthly_income.values
            growth = ((values[-1] - values[-2]) / values[-2] * 100) if values[-2] > 0 else 0

        return {
            'total': round(float(incomes['amount'].sum()), 2),
            'monthlyTrend': {
                str(k.strftime('%Y-%m')): round(float(v), 2) for k, v in monthly_income.items()
            },
            'sourceBreakdown': {
                str(k): round(float(v), 2) for k, v in source_breakdown.items()
            },
            'monthlyGrowth': round(float(growth), 2),
            'averageMonthly': round(float(monthly_income.mean()), 2) if not monthly_income.empty else 0
        }

    def get_savings_analysis(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return self._empty_response()

        df = pd.DataFrame(transactions)
        if df.empty:
            return self._empty_response()
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        monthly = df.set_index('date').resample('ME').apply(
            lambda g: g[g['type'] == 'income']['amount'].sum() - g[g['type'] == 'expense']['amount'].sum()
        )
        monthly = monthly.to_frame(name='savings')

        total_income = float(df[df['type'] == 'income']['amount'].sum())
        total_expenses = float(df[df['type'] == 'expense']['amount'].sum())
        total_savings = total_income - total_expenses
        savings_rate = (total_savings / total_income * 100) if total_income > 0 else 0

        return {
            'totalSavings': round(total_savings, 2),
            'savingsRate': round(savings_rate, 2),
            'monthlyTrend': {
                str(k.strftime('%Y-%m')): round(float(v), 2) for k, v in monthly['savings'].items()
            },
            'totalIncome': round(total_income, 2),
            'totalExpenses': round(total_expenses, 2)
        }

    def get_budget_analysis(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        budgets = self.db.get_budgets(user_id)

        if not transactions or not budgets:
            return {'budgets': [], 'overallStatus': 'no_data'}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'budgets': [], 'overallStatus': 'no_data'}
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year

        expenses_this_month = df[
            (df['type'] == 'expense') &
            (df['date'].dt.month == current_month) &
            (df['date'].dt.year == current_year)
        ]

        results = []
        for budget in budgets:
            category = budget.get('category')
            limit = float(budget.get('monthlyLimit', 0))
            spent = 0

            if category and category != 'Overall':
                cat_expenses = expenses_this_month[expenses_this_month['category'] == category]
                spent = float(cat_expenses['amount'].sum()) if not cat_expenses.empty else 0
            elif category == 'Overall' or not category:
                spent = float(expenses_this_month['amount'].sum()) if not expenses_this_month.empty else 0

            percentage = (spent / limit * 100) if limit > 0 else 0
            remaining = limit - spent

            results.append({
                'budgetId': budget.get('budgetId', ''),
                'category': category or 'Overall',
                'limit': limit,
                'spent': round(spent, 2),
                'remaining': round(remaining, 2),
                'percentage': round(percentage, 2),
                'status': 'overspent' if percentage > 100 else 'warning' if percentage > 80 else 'on_track'
            })

        overall_spent = float(expenses_this_month['amount'].sum()) if not expenses_this_month.empty else 0
        total_limit = sum(b.get('monthlyLimit', 0) for b in budgets)
        overall_percentage = (overall_spent / total_limit * 100) if total_limit > 0 else 0

        return {
            'budgets': results,
            'overallSpent': round(overall_spent, 2),
            'totalBudget': round(total_limit, 2),
            'overallPercentage': round(overall_percentage, 2),
            'overallStatus': 'overspent' if overall_percentage > 100 else 'warning' if overall_percentage > 80 else 'on_track'
        }

    def get_health_score(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return {'score': 0, 'status': 'No Data', 'factors': {}}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'score': 0, 'status': 'No Data', 'factors': {}}
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        score = 0
        factors = {}
        now = datetime.utcnow()
        current_month = now.month
        current_year = now.year

        monthly_df = df[
            (df['date'].dt.month == current_month) &
            (df['date'].dt.year == current_year)
        ]
        monthly_income = float(monthly_df[monthly_df['type'] == 'income']['amount'].sum())
        monthly_expenses = float(monthly_df[monthly_df['type'] == 'expense']['amount'].sum())

        if monthly_income > 0 or monthly_expenses > 0:
            savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else -100
            if savings_rate >= 30:
                score += 35
                factors['savingsRate'] = 'excellent'
            elif savings_rate >= 20:
                score += 25
                factors['savingsRate'] = 'good'
            elif savings_rate >= 10:
                score += 15
                factors['savingsRate'] = 'fair'
            elif savings_rate >= 0:
                score += 5
                factors['savingsRate'] = 'low'
            else:
                score -= 20
                factors['savingsRate'] = 'negative'

        budgets = self.db.get_budgets(user_id)
        if budgets:
            total_limit = sum(float(b.get('monthlyLimit', 0)) for b in budgets)
            if total_limit > 0 and monthly_expenses > 0:
                ratio = monthly_expenses / total_limit
                if ratio <= 0.5:
                    score += 25
                    factors['budgetAdherence'] = 'excellent'
                elif ratio <= 0.75:
                    score += 20
                    factors['budgetAdherence'] = 'good'
                elif ratio <= 0.9:
                    score += 15
                    factors['budgetAdherence'] = 'fair'
                elif ratio <= 1.0:
                    score += 5
                    factors['budgetAdherence'] = 'tight'
                else:
                    score -= 25
                    factors['budgetAdherence'] = 'overspent'

        category_count = df[df['type'] == 'expense']['category'].nunique()
        if category_count >= 3:
            score += 10
            factors['diversification'] = 'good'
        elif category_count >= 1:
            score += 5
            factors['diversification'] = 'limited'

        total_tx = len(df)
        if total_tx > 20:
            score += 10
            factors['tracking'] = 'consistent'
        elif total_tx > 10:
            score += 5
            factors['tracking'] = 'moderate'
        else:
            factors['tracking'] = 'minimal'

        score = max(0, min(100, score))
        status = 'Excellent' if score >= 80 else 'Good' if score >= 60 else 'Fair' if score >= 40 else 'Needs Improvement'

        return {'score': score, 'status': status, 'factors': factors}

    def _empty_response(self):
        return {'total': 0, 'message': 'No data available'}
