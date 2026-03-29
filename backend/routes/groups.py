import os
import json
import datetime
from flask import Blueprint, request, jsonify

groups_bp = Blueprint('groups', __name__)

STORAGE_PATH = os.path.join(os.path.dirname(__file__), '../data/storage.json')

def load_data():
    if not os.path.exists(STORAGE_PATH):
        return {"posts": [], "moods": [], "groups": [], "discussion_posts": []}
    with open(STORAGE_PATH, 'r') as f:
        data = json.load(f)
        if "discussion_posts" not in data:
            data["discussion_posts"] = []
        return data

def save_data(data):
    with open(STORAGE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

@groups_bp.route('/api/groups', methods=['GET'])
def get_groups():
    data = load_data()
    return jsonify(data.get('groups', []))

@groups_bp.route('/api/groups/<group_id>', methods=['GET'])
def get_group(group_id):
    data = load_data()
    group = next((g for g in data.get('groups', []) if g['id'] == group_id), None)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    return jsonify(group)

@groups_bp.route('/api/groups/join', methods=['POST'])
def join_group():
    payload = request.json
    group_id = payload.get('groupId')
    user_id = payload.get('userId')
    
    if not group_id or not user_id:
        return jsonify({'error': 'Missing groupId or userId'}), 400
        
    data = load_data()
    group = next((g for g in data.get('groups', []) if g['id'] == group_id), None)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
        
    if user_id not in group.get('members', []):
        group.setdefault('members', []).append(user_id)
        save_data(data)
        
    return jsonify({'success': True, 'message': 'Joined group successfully'})


# ========================
# DISCUSSION BOARD
# ========================
@groups_bp.route('/api/groups/<group_id>/posts', methods=['GET'])
def get_group_posts(group_id):
    data = load_data()
    posts = [p for p in data.get('discussion_posts', []) if p.get('groupId') == group_id]
    # Sort newest first
    posts.sort(key=lambda p: p.get('timestamp', ''), reverse=True)
    return jsonify(posts)


@groups_bp.route('/api/groups/<group_id>/posts', methods=['POST'])
def create_group_post(group_id):
    payload = request.json
    text = payload.get('text', '').strip()
    author_id = payload.get('authorId', 'anonymous')

    if not text:
        return jsonify({'error': 'Post text is required'}), 400

    data = load_data()
    
    # Verify group exists
    group = next((g for g in data.get('groups', []) if g['id'] == group_id), None)
    if not group:
        return jsonify({'error': 'Group not found'}), 404

    now = datetime.datetime.now().isoformat()
    post = {
        'id': f"dp_{int(datetime.datetime.now().timestamp() * 1000)}",
        'groupId': group_id,
        'text': text,
        'authorId': author_id,
        'timestamp': now,
        'reactions': {'heart': 0, 'hug': 0, 'strength': 0},
        'reactedBy': {'heart': [], 'hug': [], 'strength': []}
    }
    
    data['discussion_posts'].append(post)
    save_data(data)
    
    return jsonify(post), 201


@groups_bp.route('/api/groups/<group_id>/posts/<post_id>/react', methods=['POST'])
def react_to_post(group_id, post_id):
    payload = request.json
    emoji = payload.get('emoji')
    user_id = payload.get('userId', 'anonymous')

    emoji_map = {'❤️': 'heart', '🤗': 'hug', '💪': 'strength'}
    reaction_key = emoji_map.get(emoji)
    
    if not reaction_key:
        return jsonify({'error': 'Invalid reaction'}), 400

    data = load_data()
    post = next((p for p in data.get('discussion_posts', []) 
                 if p.get('id') == post_id and p.get('groupId') == group_id), None)
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Initialize if needed
    if 'reactedBy' not in post:
        post['reactedBy'] = {'heart': [], 'hug': [], 'strength': []}
    if 'reactions' not in post:
        post['reactions'] = {'heart': 0, 'hug': 0, 'strength': 0}

    # Toggle reaction
    if user_id in post['reactedBy'].get(reaction_key, []):
        post['reactedBy'][reaction_key].remove(user_id)
        post['reactions'][reaction_key] = max(0, post['reactions'][reaction_key] - 1)
    else:
        post['reactedBy'].setdefault(reaction_key, []).append(user_id)
        post['reactions'][reaction_key] = post['reactions'].get(reaction_key, 0) + 1

    save_data(data)
    return jsonify({'success': True, 'reactions': post['reactions']})

