from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('fullName', data.get('name', ''))
    email = data.get('email', '')
    password = data.get('password', '')

    if not all([full_name, email, password]):
        return jsonify({'error': 'All fields are required'}), 400

    try:
        result = auth_service.register(full_name, email, password)
        return jsonify({'message': 'Registration successful', 'user': result}), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')

    if not all([email, password]):
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        result = auth_service.login(email, password)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 401

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    try:
        profile = auth_service.get_profile(user_id)
        return jsonify(profile), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    full_name = data.get('fullName', '')

    if not full_name.strip():
        return jsonify({'error': 'Full name is required'}), 400

    try:
        profile = auth_service.update_profile(user_id, full_name)
        return jsonify(profile), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    current_password = data.get('currentPassword', '')
    new_password = data.get('newPassword', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    try:
        auth_service.change_password(user_id, current_password, new_password)
        return jsonify({'message': 'Password updated successfully'}), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
