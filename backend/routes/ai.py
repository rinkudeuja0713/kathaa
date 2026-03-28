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

    # If no Gemini key or model, use fallback
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