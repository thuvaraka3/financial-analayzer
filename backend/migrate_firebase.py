from dotenv import load_dotenv; load_dotenv()
import os
from firebase_admin import credentials, initialize_app, firestore, get_app
try:
    app = get_app()
except:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json'))
    app = initialize_app(cred)
db = firestore.client()

print("Migrating existing Firebase data to match project schema...")

# Fix budgets: add category, fix userId type, ensure monthlyLimit is float
budgets = list(db.collection('budgets').stream())
for b in budgets:
    data = b.to_dict()
    updates = {}
    needs_update = False

    if 'category' not in data:
        updates['category'] = 'Overall'
        needs_update = True

    uid = data.get('userId')
    if isinstance(uid, int):
        updates['userId'] = str(uid)
        needs_update = True
        print(f"  Budget {b.id}: fixed userId {uid} -> '{uid}'")

    if isinstance(data.get('monthlyLimit'), int):
        updates['monthlyLimit'] = float(data['monthlyLimit'])
        needs_update = True
        print(f"  Budget {b.id}: fixed monthlyLimit type")

    if needs_update:
        b.reference.update(updates)
        print(f"  Budget {b.id}: updated {list(updates.keys())}")
    else:
        print(f"  Budget {b.id}: OK")

# Fix transactions: userId string instead of int
txs = list(db.collection('transactions').stream())
for t in txs:
    data = t.to_dict()
    uid = data.get('userId')
    if isinstance(uid, int):
        t.reference.update({'userId': str(uid)})
        print(f"  Transaction {t.id}: fixed userId {uid} -> '{uid}'")
    else:
        print(f"  Transaction {t.id}: OK")

# Fix user: add fullName, passwordHash if needed
users = list(db.collection('users').stream())
for u in users:
    data = u.to_dict()
    updates = {}
    needs_update = False

    if 'fullName' not in data and data.get('name'):
        updates['fullName'] = data['name']
        needs_update = True
        print(f"  User {u.id}: added fullName from name")

    if 'passwordHash' not in data and data.get('password'):
        updates['passwordHash'] = data['password']
        needs_update = True
        print(f"  User {u.id}: added passwordHash from password")

    if needs_update:
        u.reference.update(updates)
        print(f"  User {u.id}: updated {list(updates.keys())}")
    else:
        print(f"  User {u.id}: OK")

print("Migration complete!")
