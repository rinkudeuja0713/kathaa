import os
import json
import datetime
import random
import requests
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

chautari_bp = Blueprint('chautari', __name__)

STORAGE_PATH = os.path.join(os.path.dirname(__file__), '../data/storage.json')
DAILY_API_KEY = os.getenv('DAILY_API_KEY')
DAILY_API_URL = 'https://api.daily.co/v1'

_data_cache = None
_last_mtime = 0

def load_data():
    global _data_cache, _last_mtime
    
    if not os.path.exists(STORAGE_PATH):
        return {"posts": [], "moods": [], "groups": [], "rooms": [], "sessions": []}
    
    mtime = os.path.getmtime(STORAGE_PATH)
    if _data_cache is not None and mtime == _last_mtime:
        return _data_cache
    
    with open(STORAGE_PATH, 'r') as f:
        try:
            data = json.load(f)
            if "rooms" not in data: data["rooms"] = []
            if "sessions" not in data: data["sessions"] = []
            _data_cache = data
            _last_mtime = mtime
            return data
        except json.JSONDecodeError:
            return {"posts": [], "moods": [], "groups": [], "rooms": [], "sessions": []}

def save_data(data):
    with open(STORAGE_PATH, 'w') as f:
        json.dump(data, f, indent=4)

def create_daily_room(room_name):
    """Create a real Daily.co room via their REST API."""
    if not DAILY_API_KEY:
        return None, "DAILY_API_KEY not configured"

    # Sanitize room name for Daily (lowercase, no spaces, alphanumeric + hyphens)
    safe_name = room_name.lower().replace(' ', '-')
    safe_name = ''.join(c for c in safe_name if c.isalnum() or c == '-')
    safe_name = f"kathaa-{safe_name}-{random.randint(1000, 9999)}"

    headers = {
        'Authorization': f'Bearer {DAILY_API_KEY}',
        'Content-Type': 'application/json'
    }

    payload = {
        'name': safe_name,
        'properties': {
            'start_audio_off': True,       # Mic off by default
            'start_video_off': True,       # No video — audio only platform
            'enable_chat': False,          # No chat per spec
            'exp': int((datetime.datetime.now() + datetime.timedelta(hours=4)).timestamp()),
        }
    }

    try:
        resp = requests.post(f'{DAILY_API_URL}/rooms', headers=headers, json=payload)
        if resp.status_code == 200:
            room_data = resp.json()
            return room_data.get('url'), None
        else:
            error_detail = resp.json().get('info', resp.text)
            return None, f"Daily API error ({resp.status_code}): {error_detail}"
    except Exception as e:
        return None, f"Failed to connect to Daily.co: {str(e)}"


@chautari_bp.route('/api/chautari/rooms/<group_id>', methods=['GET'])
def get_rooms(group_id):
    data = load_data()
    rooms = [r for r in data.get('rooms', []) if r['groupId'] == group_id]
    sessions = [s for s in data.get('sessions', []) if s['groupId'] == group_id]
    return jsonify({
        'rooms': rooms,
        'sessions': sessions
    })


@chautari_bp.route('/api/chautari/rooms/join', methods=['POST'])
def join_room():
    payload = request.json
    room_id = payload.get('roomId')
    user_id = payload.get('userId')
    display_name = payload.get('displayName')

    data = load_data()
    room = next((r for r in data.get('rooms', []) if r['id'] == room_id), None)

    if not room:
        return jsonify({'error': 'Room not found'}), 404

    # Check if we already have a valid Daily.co URL for this room
    existing_url = room.get('dailyUrl')

    if existing_url:
        # Re-use the existing room URL
        return jsonify({
            'roomUrl': existing_url,
            'roomInfo': room
        })

    # Create a new Daily.co room
    daily_url, error = create_daily_room(room.get('name', 'kathaa-room'))

    if error:
        return jsonify({'error': error, 'hint': 'Check your DAILY_API_KEY in backend/.env'}), 500

    # Save the Daily URL back to storage so we reuse it
    room['dailyUrl'] = daily_url
    room['status'] = 'active'
    save_data(data)

    return jsonify({
        'roomUrl': daily_url,
        'roomInfo': room
    })


@chautari_bp.route('/api/chautari/config-check', methods=['GET'])
def config_check():
    """Health check endpoint to verify Daily.co API key is working."""
    if not DAILY_API_KEY:
        return jsonify({
            'configured': False,
            'message': 'DAILY_API_KEY is not set in backend/.env'
        })

    headers = {'Authorization': f'Bearer {DAILY_API_KEY}'}
    try:
        resp = requests.get(f'{DAILY_API_URL}/rooms', headers=headers, params={'limit': 1})
        if resp.status_code == 200:
            return jsonify({'configured': True, 'message': 'Daily.co API key is valid'})
        else:
            return jsonify({
                'configured': False,
                'message': f'Daily.co API returned {resp.status_code}: {resp.text}'
            })
    except Exception as e:
        return jsonify({'configured': False, 'message': str(e)})


@chautari_bp.route('/api/chautari/sessions', methods=['GET'])
def get_all_sessions():
    data = load_data()
    return jsonify(data.get('sessions', []))


@chautari_bp.route('/api/chautari/sessions/rsvp', methods=['POST'])
def rsvp_session():
    payload = request.json
    session_id = payload.get('sessionId')
    user_id = payload.get('userId')

    data = load_data()
    session = next((s for s in data.get('sessions', []) if s['id'] == session_id), None)

    if not session:
        return jsonify({'error': 'Session not found'}), 404

    if user_id not in session.get('rsvps', []):
        session.setdefault('rsvps', []).append(user_id)
        session['rsvpCount'] = len(session['rsvps'])
        save_data(data)

    return jsonify({'success': True, 'rsvpCount': session['rsvpCount']})
