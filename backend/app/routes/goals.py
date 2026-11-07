from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.firestore_service import FirestoreService

goals_bp = Blueprint('goals', __name__)
db = FirestoreService()

@goals_bp.route('', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = get_jwt_identity()
    goals = db.get_goals(user_id)
    return jsonify({'goals': goals}), 200

@goals_bp.route('', methods=['POST'])
@jwt_required()
def create_goal():
    user_id = get_jwt_identity()
    data = request.get_json()

    goal_name = data.get('goalName', data.get('goal_name'))
    target_amount = data.get('targetAmount', data.get('target_amount'))
    deadline = data.get('deadline', '')

    if not all([goal_name, target_amount]):
        return jsonify({'error': 'Goal name and target amount are required'}), 400

    goal = {
        'userId': user_id,
        'goalName': goal_name,
        'targetAmount': float(target_amount),
        'currentAmount': 0,
        'deadline': deadline
    }

    result = db.create_goal(goal)
    return jsonify({'message': 'Goal created successfully', 'goal': result}), 201

@goals_bp.route('/<goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    update_data = {}
    if 'goalName' in data:
        update_data['goalName'] = data['goalName']
    if 'targetAmount' in data:
        update_data['targetAmount'] = float(data['targetAmount'])
    if 'currentAmount' in data:
        update_data['currentAmount'] = float(data['currentAmount'])
    if 'deadline' in data:
        update_data['deadline'] = data['deadline']

    try:
        db.update_goal(goal_id, update_data)
        return jsonify({'message': 'Goal updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@goals_bp.route('/<goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    user_id = get_jwt_identity()
    try:
        db.delete_goal(goal_id)
        return jsonify({'message': 'Goal deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
