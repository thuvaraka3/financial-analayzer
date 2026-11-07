from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService
from datetime import datetime

transactions_bp = Blueprint('transactions', __name__)
db = FirestoreService()

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    category = request.args.get('category')
    tx_type = request.args.get('type')

    filters = {}
    if category:
        filters['category'] = category
    if tx_type:
        filters['type'] = tx_type

    transactions = db.get_transactions(user_id, filters=filters, limit=limit)

    return jsonify({
        'transactions': transactions,
        'total': len(transactions),
        'page': page,
        'limit': limit
    }), 200

@transactions_bp.route('', methods=['POST'])
@jwt_required()
def add_transaction():
    user_id = get_jwt_identity()
    data = request.get_json()

    tx_type = data.get('type')
    category = data.get('category')
    amount = data.get('amount')
    date = data.get('date')
    description = data.get('description', '')

    if not all([tx_type, category, amount, date]):
        return jsonify({'error': 'Type, category, amount, and date are required'}), 400

    transaction = {
        'userId': user_id,
        'type': tx_type,
        'category': category,
        'amount': float(amount),
        'date': date,
        'description': description
    }

    result = db.create_transaction(transaction)
    return jsonify({'message': 'Transaction added successfully', 'transaction': result}), 201

@transactions_bp.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    update_data = {}
    if 'type' in data:
        update_data['type'] = data['type']
    if 'category' in data:
        update_data['category'] = data['category']
    if 'amount' in data:
        update_data['amount'] = float(data['amount'])
    if 'date' in data:
        update_data['date'] = data['date']
    if 'description' in data:
        update_data['description'] = data['description']

    try:
        db.update_transaction(transaction_id, update_data)
        return jsonify({'message': 'Transaction updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()
    try:
        db.delete_transaction(transaction_id)
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
