import os
import random
import google.generativeai as genai
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use a lightweight model (gemini-1.5-flash is fast and cheap)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

ai_bp = Blueprint('ai', __name__)

# Fallback suggestions (rotates randomly)
FALLBACKS = [
    "Breathe deeply. You are not alone in this feeling.",
    "It's okay to feel this way. Take one small step today.",
    "Write down one thing that brought you peace recently.",
    "Reach out to someone you trust – even a short message helps.",
    "You are stronger than you know. This moment will pass.",
    "Close your eyes and take three slow breaths. You are safe.",
    "Your feelings are valid. Give yourself permission to rest.",
    "A warm drink and a quiet moment can do wonders."
]

@ai_bp.route('/api/ai/suggest', methods=['POST'])
def get_suggestion():
    data = request.json
    user_text = data.get('text', '')
    if not user_text:
        return jsonify({'suggestion': 'Share what’s on your mind for a gentle suggestion.'})

    if not model:
        return jsonify({'suggestion': random.choice(FALLBACKS)})

    try:
        prompt = f"Give a short, compassionate, supportive suggestion (max 30 words) for someone who said: {user_text}"
        response = model.generate_content(prompt)
        suggestion = response.text.strip()
        if not suggestion:
            suggestion = random.choice(FALLBACKS)
    except Exception as e:
        print("Gemini error:", e)
        suggestion = random.choice(FALLBACKS)

    return jsonify({'suggestion': suggestion})

@ai_bp.route('/api/ai/verify-mentor', methods=['POST'])
def verify_mentor():
    data = request.json
    title = data.get('title', '')
    bio = data.get('bio', '')
    
    if not title or not bio:
        return jsonify({'error': 'Missing title or bio'}), 400

    # If no Gemini model, use a simple keyword-based heuristic
    if not model:
        keywords = ['counselor', 'therapist', 'doctor', 'psychologist', 'phd', 'msw', 'licensed', 'expert']
        is_credible = any(k in title.lower() or k in bio.lower() for k in keywords)
        return jsonify({
            'status': 'VERIFIED' if is_credible else 'PENDING',
            'reason': 'Verified via automated credential matching.' if is_credible else 'Requires manual review of specific expertise.'
        })

    try:
        prompt = (
            f"Evaluate the professional credibility of this support mentor application:\n"
            f"Title: {title}\n"
            f"Bio: {bio}\n\n"
            "Criteria: Does this person sound like a legitimate professional or experienced peer supporter?\n"
            "Return ONLY a JSON object: {\"status\": \"VERIFIED\" or \"PENDING\", \"reason\": \"short explanation\"}"
        )
        response = model.generate_content(prompt)
        resp_text = response.text.strip()
        
        # Robust JSON extraction
        import re
        json_match = re.search(r'\{.*\}', resp_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            return jsonify(result)
        else:
            return jsonify({'status': 'PENDING', 'reason': 'AI response format invalid, requires manual review.'})
    except Exception as e:
        print("AI Verification error:", e)
        return jsonify({'status': 'PENDING', 'reason': 'AI verification encountered an error, defaulting to manual review.'})