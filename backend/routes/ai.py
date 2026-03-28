import os
import random
import openai
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')

ai_bp = Blueprint('ai', __name__)

# List of fallback suggestions (rotates randomly)
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

    # If no API key, return a random fallback
    if not openai.api_key:
        return jsonify({'suggestion': random.choice(FALLBACKS)})

    try:
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=f"Give a short, compassionate, supportive suggestion (max 30 words) for someone who said: {user_text}",
            max_tokens=60,
            temperature=0.8  # higher temperature = more variety
        )
        suggestion = response.choices[0].text.strip()
        if not suggestion:
            suggestion = random.choice(FALLBACKS)
    except Exception as e:
        print("OpenAI error:", e)
        suggestion = random.choice(FALLBACKS)

    return jsonify({'suggestion': suggestion})