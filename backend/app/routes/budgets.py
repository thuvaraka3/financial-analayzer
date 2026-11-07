from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService

budgets_bp = Blueprint('budgets', __name__)
db = FirestoreService()

@budgets_bp.route('', methods=['GET'])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
    budgets = db.get_budgets(user_id)
    return jsonify({'budgets': budgets}), 200

@budgets_bp.route('', methods=['POST'])
@jwt_required()
def create_budget():
    user_id = get_jwt_identity()
    data = request.get_json()

    category = data.get('category', 'Overall')
    monthly_limit = data.get('monthlyLimit', data.get('monthly_limit'))

    if not monthly_limit:
        return jsonify({'error': 'Monthly limit is required'}), 400

    budget = {
        'userId': user_id,
        'category': category,
        'monthlyLimit': float(monthly_limit)
    }

    result = db.create_budget(budget)
    return jsonify({'message': 'Budget created successfully', 'budget': result}), 201

@budgets_bp.route('/<budget_id>', methods=['PUT'])
@jwt_required()
def update_budget(budget_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    update_data = {}
    if 'category' in data:
        update_data['category'] = data['category']
    if 'monthlyLimit' in data:
        update_data['monthlyLimit'] = float(data['monthlyLimit'])

    try:
        db.update_budget(budget_id, update_data)
        return jsonify({'message': 'Budget updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@budgets_bp.route('/<budget_id>', methods=['DELETE'])
@jwt_required()
def delete_budget(budget_id):
    user_id = get_jwt_identity()
    try:
        db.delete_budget(budget_id)
        return jsonify({'message': 'Budget deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
