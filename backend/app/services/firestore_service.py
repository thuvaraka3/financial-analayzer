import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

_db = None

def get_firestore():
    global _db
    if _db is None:
        cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            cred = credentials.ApplicationDefault()
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(cred)
        _db = firestore.client()
    return _db

class FirestoreService:
    def __init__(self):
        self.db = get_firestore()

    def _doc_to_dict(self, doc):
        if doc is None:
            return None
        data = doc.to_dict() or {}
        data['id'] = doc.id
        return data

    def _collection_ref(self, name):
        return self.db.collection(name)

    # Users
    def create_user(self, uid, data):
        self._collection_ref('users').document(uid).set(data)

    def get_user(self, uid):
        doc = self._collection_ref('users').document(uid).get()
        data = self._doc_to_dict(doc)
        if data is not None and not data.get('createdAt'):
            create_time = getattr(doc, 'create_time', None)
            if create_time is not None:
                data['createdAt'] = create_time.isoformat()
        return data

    def get_user_by_email(self, email):
        docs = self._collection_ref('users').where('email', '==', email).limit(1).stream()
        for doc in docs:
            return self._doc_to_dict(doc)
        return None

    def update_user(self, uid, data):
        self._collection_ref('users').document(uid).update(data)

    # Transactions
    def create_transaction(self, data):
        doc_ref = self._collection_ref('transactions').document()
        data['transactionId'] = doc_ref.id
        data['createdAt'] = datetime.utcnow().isoformat()
        doc_ref.set(data)
        return data

    def get_transactions(self, user_id, filters=None, limit=20, offset=0):
        query = self._collection_ref('transactions').where('userId', '==', user_id)
        if filters:
            if 'type' in filters:
                query = query.where('type', '==', filters['type'])
            if 'category' in filters:
                query = query.where('category', '==', filters['category'])
        docs = list(query.stream())
        results = [self._doc_to_dict(d) for d in docs]
        results.sort(key=lambda x: x.get('date', ''), reverse=True)
        return results[:limit]

    def get_all_transactions(self, user_id):
        docs = self._collection_ref('transactions').where('userId', '==', user_id).stream()
        return [self._doc_to_dict(d) for d in docs]

    def update_transaction(self, transaction_id, data):
        self._collection_ref('transactions').document(transaction_id).update(data)

    def delete_transaction(self, transaction_id):
        self._collection_ref('transactions').document(transaction_id).delete()

    # Budgets
    def create_budget(self, data):
        doc_ref = self._collection_ref('budgets').document()
        data['budgetId'] = doc_ref.id
        data['createdAt'] = datetime.utcnow().isoformat()
        doc_ref.set(data)
        return data

    def get_budgets(self, user_id):
        docs = self._collection_ref('budgets').where('userId', '==', user_id).stream()
        return [self._doc_to_dict(d) for d in docs]

    def get_budget(self, budget_id):
        doc = self._collection_ref('budgets').document(budget_id).get()
        return self._doc_to_dict(doc)

    def update_budget(self, budget_id, data):
        self._collection_ref('budgets').document(budget_id).update(data)

    def delete_budget(self, budget_id):
        self._collection_ref('budgets').document(budget_id).delete()

    # Savings Goals
    def create_goal(self, data):
        doc_ref = self._collection_ref('savingsGoals').document()
        data['goalId'] = doc_ref.id
        data['createdAt'] = datetime.utcnow().isoformat()
        doc_ref.set(data)
        return data

    def get_goals(self, user_id):
        docs = self._collection_ref('savingsGoals').where('userId', '==', user_id).stream()
        return [self._doc_to_dict(d) for d in docs]

    def get_goal(self, goal_id):
        doc = self._collection_ref('savingsGoals').document(goal_id).get()
        return self._doc_to_dict(doc)

    def update_goal(self, goal_id, data):
        self._collection_ref('savingsGoals').document(goal_id).update(data)

    def delete_goal(self, goal_id):
        self._collection_ref('savingsGoals').document(goal_id).delete()

    # Chat History
    def add_chat_message(self, data):
        doc_ref = self._collection_ref('chatHistory').document()
        data['chatId'] = doc_ref.id
        data['timestamp'] = datetime.utcnow().isoformat()
        doc_ref.set(data)
        return data

    def get_chat_history(self, user_id, limit=50):
        docs = list(self._collection_ref('chatHistory').where('userId', '==', user_id).stream())
        results = [self._doc_to_dict(d) for d in docs]
        results.sort(key=lambda x: x.get('timestamp', ''))
        return results[-limit:]

    # AI Reports
    def create_report(self, data):
        doc_ref = self._collection_ref('aiReports').document()
        data['reportId'] = doc_ref.id
        data['generatedAt'] = datetime.utcnow().isoformat()
        doc_ref.set(data)
        return data

    def get_reports(self, user_id):
        docs = list(self._collection_ref('aiReports').where('userId', '==', user_id).stream())
        results = [self._doc_to_dict(d) for d in docs]
        results.sort(key=lambda x: x.get('generatedAt', ''), reverse=True)
        return results

    def get_report_by_month(self, user_id, month):
        docs = (self._collection_ref('aiReports')
                .where('userId', '==', user_id)
                .where('month', '==', month)
                .limit(1)
                .stream())
        for doc in docs:
            return self._doc_to_dict(doc)
        return None
