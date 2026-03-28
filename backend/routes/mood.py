import os
import json
from flask import Blueprint, request, jsonify
from datetime import datetime

mood_bp = Blueprint('mood', __name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_FILE = os.path.join(DATA_DIR, 'storage.json')  # same file as posts

def ensure_data_dir():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

def load_data():
    ensure_data_dir()
    if not os.path.exists(DATA_FILE):
        return {'posts': [], 'moods': []}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    ensure_data_dir()
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@mood_bp.route('/api/moods', methods=['GET'])
def get_moods():
    data = load_data()
    return jsonify(data.get('moods', []))

@mood_bp.route('/api/moods', methods=['POST'])
def add_mood():
    data = load_data()
    mood_entry = request.json
    mood_entry['timestamp'] = datetime.now().isoformat()
    if 'moods' not in data:
        data['moods'] = []
    data['moods'].append(mood_entry)
    save_data(data)
    return jsonify(mood_entry), 201

@mood_bp.route('/api/moods/user/<user_id>', methods=['GET'])
def get_user_moods(user_id):
    data = load_data()
    user_moods = [m for m in data.get('moods', []) if m.get('userId') == user_id]
    return jsonify(user_moods)