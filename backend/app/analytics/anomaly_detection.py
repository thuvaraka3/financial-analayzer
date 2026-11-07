import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from scipy import stats
from datetime import datetime, timedelta
from ..services.firestore_service import FirestoreService

class AnomalyDetector:
    def __init__(self):
        self.db = FirestoreService()

    def detect_anomalies(self, user_id):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions or len(transactions) < 5:
            return {'anomalies': [], 'message': 'Need at least 5 transactions for anomaly detection'}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'anomalies': [], 'message': 'No data'}

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        anomalies = []

        expenses = df[df['type'] == 'expense'].copy()
        if not expenses.empty and len(expenses) >= 5:
            amounts = expenses['amount'].values.reshape(-1, 1)

            iso_forest = IsolationForest(contamination=0.1, random_state=42, n_estimators=100)
            predictions = iso_forest.fit_predict(amounts)

            anomaly_indices = np.where(predictions == -1)[0]
            for idx in anomaly_indices:
                tx = expenses.iloc[idx]
                anomalies.append({
                    'transactionId': tx.get('transactionId', tx.get('id', '')),
                    'type': 'spending_spike',
                    'category': tx.get('category', ''),
                    'amount': float(tx['amount']),
                    'date': str(tx.get('date', '').date()) if hasattr(tx.get('date', ''), 'date') else str(tx.get('date', '')),
                    'description': tx.get('description', ''),
                    'severity': 'high' if float(tx['amount']) > amounts.mean() + 2 * amounts.std() else 'medium',
                    'detectionMethod': 'Isolation Forest'
                })

        if not expenses.empty and len(expenses) >= 3:
            z_scores = np.abs(stats.zscore(expenses['amount']))
            outlier_indices = np.where(z_scores > 2.5)[0]
            for idx in outlier_indices:
                if idx not in [a['amount'] for a in anomalies]:
                    tx = expenses.iloc[idx]
                    anomalies.append({
                        'transactionId': tx.get('transactionId', tx.get('id', '')),
                        'type': 'statistical_outlier',
                        'category': tx.get('category', ''),
                        'amount': float(tx['amount']),
                        'date': str(tx.get('date', '').date()) if hasattr(tx.get('date', ''), 'date') else str(tx.get('date', '')),
                        'description': tx.get('description', ''),
                        'severity': 'high' if z_scores[idx] > 3 else 'medium',
                        'detectionMethod': 'Statistical Outlier Detection (Z-Score)'
                    })

        monthly_spending = expenses.set_index('date').resample('ME')['amount'].sum() if not expenses.empty else pd.Series(dtype=float)
        if len(monthly_spending) >= 2:
            pct_changes = monthly_spending.pct_change() * 100
            spike_months = pct_changes[pct_changes > 50]
            for month, change in spike_months.items():
                if not pd.isna(change):
                    month_str = month.strftime('%Y-%m') if hasattr(month, 'strftime') else str(month)
                    anomalies.append({
                        'type': 'monthly_spending_spike',
                        'month': month_str,
                        'percentageIncrease': round(float(change), 2),
                        'amount': round(float(monthly_spending[month]), 2),
                        'severity': 'high' if change > 100 else 'medium',
                        'detectionMethod': 'Month-over-Month Trend Analysis'
                    })

        return {
            'anomalies': anomalies,
            'totalAnomalies': len(anomalies),
            'message': f'Found {len(anomalies)} anomalies' if anomalies else 'No anomalies detected'
        }

    def get_transaction_risk_score(self, user_id, transaction_amount, transaction_category):
        transactions = self.db.get_all_transactions(user_id)
        if not transactions:
            return {'riskScore': 0, 'riskLevel': 'low'}

        df = pd.DataFrame(transactions)
        if df.empty:
            return {'riskScore': 0, 'riskLevel': 'low'}

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)

        category_tx = df[df['category'] == transaction_category]
        risk_score = 0

        if not category_tx.empty:
            mean = category_tx['amount'].mean()
            std = category_tx['amount'].std()
            z = (transaction_amount - mean) / std if std > 0 else 0
            if abs(z) > 3:
                risk_score += 50
            elif abs(z) > 2:
                risk_score += 30
            elif abs(z) > 1.5:
                risk_score += 15

        all_amounts = df['amount'].values
        if len(all_amounts) > 1:
            threshold = np.percentile(all_amounts, 95)
            if transaction_amount > threshold:
                risk_score += 30

        risk_level = 'high' if risk_score > 60 else 'medium' if risk_score > 30 else 'low'
        return {'riskScore': min(risk_score, 100), 'riskLevel': risk_level}
