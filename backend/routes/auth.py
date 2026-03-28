import os
import json
from flask import Blueprint, request, jsonify
import uuid

auth_bp = Blueprint('auth', __name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_users():
    ensure_data_dir()
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    ensure_data_dir()
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

@auth_bp.route('/api/auth/anon', methods=['GET'])
def get_anon_id():
    anon_id = str(uuid.uuid4())
    return jsonify({'anonId': anon_id})

@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    users = load_users()
    if email in users:
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    users[email] = {'password': password}
    save_users(users)
    return jsonify({'success': True, 'message': 'Account created'})

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    users = load_users()
    if email not in users or users[email]['password'] != password:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    return jsonify({'success': True, 'message': 'Logged in', 'user': {'email': email}})

@auth_bp.route('/api/auth/reset', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    users = load_users()
    if email not in users:
        return jsonify({'success': False, 'message': 'Email not found'}), 404
    # In real app, send reset email
    return jsonify({'success': True, 'message': 'If the email exists, a reset link has been sent.'})