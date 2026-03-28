import os
import json
from flask import Blueprint, request, jsonify
from datetime import datetime

posts_bp = Blueprint('posts', __name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DATA_FILE = os.path.join(DATA_DIR, 'storage.json')

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

@posts_bp.route('/api/posts', methods=['GET'])
def get_posts():
    data = load_data()
    return jsonify(data['posts'])

@posts_bp.route('/api/posts', methods=['POST'])
def add_post():
    data = load_data()
    new_post = request.json
    new_post['id'] = datetime.now().timestamp()
    new_post['timestamp'] = datetime.now().isoformat()
    data['posts'].insert(0, new_post)
    save_data(data)
    return jsonify(new_post), 201

@posts_bp.route('/api/posts/user/<user_id>', methods=['GET'])
def get_user_posts(user_id):
    data = load_data()
    user_posts = [p for p in data['posts'] if p.get('authorId') == user_id]
    return jsonify(user_posts)

@posts_bp.route('/api/posts/tag/<tag>', methods=['GET'])
def get_posts_by_tag(tag):
    data = load_data()
    filtered = [p for p in data['posts'] if tag in p.get('tags', [])]
    return jsonify(filtered)