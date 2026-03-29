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

import random

ADJECTIVES = ["Golden", "Silver", "Misty", "Silent", "Hidden", "Glowing", "Ancient", "Serene", "Brave", "Kind"]
NOUNS = ["Diya", "Mountain", "River", "Lotus", "Star", "Cloud", "Forest", "Harbor", "Phoenix", "Spirit"]
AVATAR_EMOJIS = ["🪔", "🏔️", "🌊", "🪷", "✨", "☁️", "🌲", "⚓", "🕊️", "🏵️"]

def generate_anon_identity():
    name = f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)}"
    avatar_index = random.randint(0, len(AVATAR_EMOJIS) - 1)
    return name, avatar_index


def generate_unique_anon_identity(users):
    """Ensure anonymous display name is unique across all accounts."""
    taken = {u.get('anon_name') for u in users.values() if u.get('anon_name')}
    for _ in range(400):
        anon_name, idx = generate_anon_identity()
        avatar = AVATAR_EMOJIS[idx]
        if anon_name not in taken:
            return anon_name, avatar
    anon_name, idx = generate_anon_identity()
    anon_name = f"{anon_name} {random.randint(1000, 9999)}"
    return anon_name, AVATAR_EMOJIS[idx]


def public_user_payload(email, user_data):
    """Shape stored in localStorage / returned to clients (no password)."""
    return {
        'email': email,
        'role': user_data.get('role', 'storyteller'),
        'active_persona': user_data.get('active_persona', 'storyteller'),
        'is_verified': user_data.get('is_verified', False),
        'anon_name': user_data.get('anon_name'),
        'anon_avatar': user_data.get('anon_avatar'),
    }


@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'storyteller') # 'storyteller' or 'mentor'
    
    users = load_users()
    if email in users:
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    anon_name, anon_avatar = generate_unique_anon_identity(users)
    
    users[email] = {
        'password': password,
        'role': role,
        'is_verified': False,
        'active_persona': role, # default to signed-up role
        'mentor_profile': data.get('mentor_profile', None),
        'anon_name': anon_name,
        'anon_avatar': anon_avatar
    }
    save_users(users)
    return jsonify({
        'success': True, 
        'message': 'Account created',
        'user': public_user_payload(email, users[email])
    })

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    users = load_users()
    if email not in users or users[email]['password'] != password:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    user_data = users[email]
    # Retroactively add anon identity if missing
    if 'anon_name' not in user_data:
        anon_name, anon_avatar = generate_unique_anon_identity(users)
        user_data['anon_name'] = anon_name
        user_data['anon_avatar'] = anon_avatar
        save_users(users)

    return jsonify({
        'success': True, 
        'message': 'Logged in', 
        'user': public_user_payload(email, user_data)
    })

@auth_bp.route('/api/auth/profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    users = load_users()
    if not email or email not in users:
        return jsonify({'error': 'User not found'}), 404
    
    user = users[email]
    return jsonify({
        'email': email,
        'role': user.get('role', 'storyteller'),
        'active_persona': user.get('active_persona', 'storyteller'),
        'is_verified': user.get('is_verified', False),
        'mentor_profile': user.get('mentor_profile'),
        'anon_name': user.get('anon_name'),
        'anon_avatar': user.get('anon_avatar')
    })

@auth_bp.route('/api/auth/switch-persona', methods=['POST'])
def switch_persona():
    data = request.json
    email = data.get('email')
    new_persona = data.get('persona') # 'mentor' or 'storyteller'
    
    users = load_users()
    if not email or email not in users:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    user = users[email]
    if user.get('role') != 'mentor' and new_persona == 'mentor':
        return jsonify({'success': False, 'message': 'Access denied: You are not a mentor'}), 403
    
    user['active_persona'] = new_persona
    save_users(users)
    return jsonify({'success': True, 'persona': new_persona})

@auth_bp.route('/api/auth/admin/verify', methods=['POST'])
def admin_verify():
    data = request.json
    email = data.get('email')
    status = data.get('status', True) # True for verified
    
    users = load_users()
    if email in users:
        users[email]['is_verified'] = status
        save_users(users)
        return jsonify({'success': True, 'message': f'User {email} verification set to {status}'})
    return jsonify({'success': False, 'message': 'User not found'}), 404