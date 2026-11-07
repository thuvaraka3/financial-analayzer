import bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta
from .firestore_service import FirestoreService

class AuthService:
    def __init__(self):
        self.db = FirestoreService()

    def register(self, full_name, email, password):
        existing = self.db.get_user_by_email(email)
        if existing:
            raise ValueError('Email already registered')

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        uid = email.replace('.', '_at_').replace('@', '_at_')

        user_data = {
            'fullName': full_name,
            'email': email,
            'passwordHash': password_hash,
            'createdAt': datetime.utcnow().isoformat(),
            'lastLogin': datetime.utcnow().isoformat()
        }
        self.db.create_user(uid, user_data)
        return {'uid': uid, 'fullName': full_name, 'email': email}

    def login(self, email, password):
        user = self.db.get_user_by_email(email)
        if not user:
            raise ValueError('Invalid credentials')

        # Support both 'passwordHash' (new) and 'password' (old schema)
        stored_hash = user.get('passwordHash') or user.get('password', '')
        if not stored_hash or not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            raise ValueError('Invalid credentials')

        self.db.update_user(user['id'], {'lastLogin': datetime.utcnow().isoformat()})

        access_token = create_access_token(identity=user['id'])
        return {
            'access_token': access_token,
            'user': {
                'uid': user['id'],
                'fullName': user.get('fullName', ''),
                'email': user['email']
            }
        }

    def get_profile(self, user_id):
        user = self.db.get_user(user_id)
        if not user:
            raise ValueError('User not found')
        return {
            'uid': user['id'],
            'fullName': user.get('fullName', ''),
            'email': user['email'],
            'createdAt': user.get('createdAt', ''),
            'lastLogin': user.get('lastLogin', '')
        }

    def update_profile(self, user_id, full_name):
        user = self.db.get_user(user_id)
        if not user:
            raise ValueError('User not found')

        full_name = (full_name or '').strip()
        if not full_name:
            raise ValueError('Full name is required')

        self.db.update_user(user_id, {'fullName': full_name})
        return self.get_profile(user_id)

    def change_password(self, user_id, current_password, new_password):
        user = self.db.get_user(user_id)
        if not user:
            raise ValueError('User not found')

        stored_hash = user.get('passwordHash') or user.get('password', '')
        if not stored_hash or not bcrypt.checkpw(current_password.encode('utf-8'), stored_hash.encode('utf-8')):
            raise ValueError('Current password is incorrect')

        if not new_password or len(new_password) < 6:
            raise ValueError('New password must be at least 6 characters')

        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        self.db.update_user(user_id, {'passwordHash': password_hash})
