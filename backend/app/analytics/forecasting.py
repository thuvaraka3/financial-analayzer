import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
from ..services.firestore_service import FirestoreService

class FinancialForecaster:
    def __init__(self):
        self.db = FirestoreService()

    def forecast_expenses(self, user_id, periods=3):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return {'error': 'Insufficient data for forecasting'}

        df = pd.DataFrame(transactions)
        if df.empty or 'amount' not in df.columns or 'date' not in df.columns:
            return {'error': 'Insufficient data for forecasting'}

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')

        expenses = df[df['type'] == 'expense'].copy()
        if expenses.empty or len(expenses) < 3:
            return {'error': 'Need at least 3 expense records for forecasting'}

        monthly = expenses.set_index('date').resample('ME')['amount'].sum().reset_index()
        monthly.columns = ['ds', 'y']

        if len(monthly) < 2:
            return {'error': 'Need at least 2 months of data'}

        monthly['month_num'] = (monthly['ds'].dt.year - monthly['ds'].dt.year.min()) * 12 + monthly['ds'].dt.month

        X = monthly[['month_num']].values
        y = monthly['y'].values

        lr_model = LinearRegression()
        lr_model.fit(X, y)

        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        if len(X) >= 3:
            rf_model.fit(X, y)

        last_month_num = monthly['month_num'].max()
        future_months = np.array([[last_month_num + i + 1] for i in range(periods)])

        lr_forecast = lr_model.predict(future_months)
        rf_forecast = rf_model.predict(future_months) if len(X) >= 3 else lr_forecast

        combined_forecast = (lr_forecast * 0.4 + rf_forecast * 0.6)

        current_monthly = monthly['y'].iloc[-1] if len(monthly) > 0 else 0
        trend_direction = 'increasing' if combined_forecast[-1] > current_monthly else 'decreasing'

        results = []
        for i, val in enumerate(combined_forecast):
            pred_month = (datetime.utcnow().month + i) % 12 or 12
            pred_year = datetime.utcnow().year + ((datetime.utcnow().month + i - 1) // 12)
            results.append({
                'month': f'{pred_year}-{pred_month:02d}',
                'predictedExpenses': round(float(max(val, 0)), 2),
                'confidence': 'high' if len(monthly) >= 6 else 'medium' if len(monthly) >= 3 else 'low'
            })

        return {
            'forecast': results,
            'trend': trend_direction,
            'currentMonthlyExpenses': round(float(current_monthly), 2),
            'averagePredicted': round(float(np.mean(combined_forecast)), 2),
            'dataPoints': len(monthly)
        }

    def forecast_savings(self, user_id, periods=3):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return {'error': 'Insufficient data'}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'error': 'Insufficient data'}

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')

        monthly_savings = []
        date_range = pd.date_range(end=datetime.utcnow(), periods=max(6, periods), freq='ME')

        for dt in date_range:
            month_data = df[df['date'].dt.month == dt.month]
            month_data = month_data[month_data['date'].dt.year == dt.year]
            income = float(month_data[month_data['type'] == 'income']['amount'].sum())
            expenses = float(month_data[month_data['type'] == 'expense']['amount'].sum())
            monthly_savings.append({'ds': dt, 'y': income - expenses})

        savings_df = pd.DataFrame(monthly_savings)
        savings_df['month_num'] = range(len(savings_df))

        model = LinearRegression()
        X = savings_df[['month_num']].values
        y = savings_df['y'].values
        model.fit(X, y)

        last_num = savings_df['month_num'].max()
        future = np.array([[last_num + i + 1] for i in range(periods)])
        forecast = model.predict(future)

        results = []
        for i, val in enumerate(forecast):
            dt = datetime.utcnow() + timedelta(days=30 * (i + 1))
            results.append({
                'month': dt.strftime('%Y-%m'),
                'predictedSavings': round(float(max(val, 0)), 2),
            })

        return {
            'forecast': results,
            'currentMonthlySavings': round(float(savings_df['y'].iloc[-1]), 2),
            'trend': 'increasing' if forecast[-1] > savings_df['y'].iloc[-1] else 'decreasing'
        }

    def detect_budget_overrun_risk(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        budgets = self.db.get_budgets(user_id)

        if not transactions or not budgets:
            return {'risk': 'low', 'message': 'Insufficient data to assess risk'}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'risk': 'low', 'message': 'No transactions found'}

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')

        now = datetime.utcnow()
        expenses_this_month = df[
            (df['type'] == 'expense') &
            (df['date'].dt.month == now.month) &
            (df['date'].dt.year == now.year)
        ]

        if expenses_this_month.empty:
            return {'risk': 'low', 'message': 'No expenses this month'}

        days_passed = now.day
        total_limit = sum(float(b.get('monthlyLimit', 0)) for b in budgets)
        spent_so_far = float(expenses_this_month['amount'].sum())

        if total_limit == 0:
            return {'risk': 'low', 'message': 'No budget set'}

        days_in_month = 30
        projected_spending = (spent_so_far / max(days_passed, 1)) * days_in_month

        overrun_risk = projected_spending > total_limit
        risk_pct = (projected_spending / total_limit * 100) if total_limit > 0 else 0

        if risk_pct > 120:
            risk_level = 'high'
        elif risk_pct > 100:
            risk_level = 'medium'
        elif risk_pct > 80:
            risk_level = 'low'
        else:
            risk_level = 'minimal'

        return {
            'risk': risk_level,
            'projectedSpending': round(projected_spending, 2),
            'budgetLimit': round(total_limit, 2),
            'spentSoFar': round(spent_so_far, 2),
            'daysPassed': days_passed,
            'message': f'Projected spending is {risk_pct:.0f}% of budget'
        }
