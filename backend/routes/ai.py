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

# Fallback suggestions (rotates randomly) — longer, warm, Nepali student focused
FALLBACKS = [
    "Sathi, your courage to share this burden matters more than you know. You're not alone — many of us feel this same weight.",
    "The homesickness you're carrying, the guilt of being away, the pressure from home — sathi, others know this pain too. Your kathaa just echoed through our community.",
    "Breathe, sathi. Rest is not giving up. Sometimes the bravest thing is admitting we're struggling. You showed that strength today.",
    "Write one honest sentence to yourself tonight. That's enough. Tomorrow can be stronger. For now, sathi, be gentle.",
    "Someone back home is thinking of you, even if you can't reach them right now. And here, your sathi family sees you.",
    "Call home if you can, sathi. Even a short voice message to hear a loved one's voice can heal more than you know.",
    "Your feelings are valid, sathi. The homesickness, the money stress, the culture shock — it's all real. You're allowed to struggle.",
    "Make yourself chai and sit quietly, sathi. That simple act of self-care — small as it is — matters. You matter.",
    "You are stronger than the struggles you carry, sathi. This moment will pass. And you'll find Nepali sathi here who understand.",
    "Your kathaa echoes here, sathi. Right now, another Nepali student reads this and realizes they're not alone either. You're helping them by being brave."
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
        # Gemini prompt for Nepali students abroad — warm, longer, personal
        prompt = f"""You are a compassionate listener in a community of Nepali students studying abroad.
Someone shared: "{user_text}"

Write a warm, personal response (2-3 sentences, max 70 words) that:
- Opens with "Sathi," 
- Validates their specific experience (homesickness, money stress, loneliness, culture shock)
- Acknowledges they're not alone — other Nepali students feel this too
- Offers ONE small, practical comfort (call home, make chai, rest, etc.)
- Closes with warmth, not clinical advice

Sound like a caring Nepali friend who truly gets the abroad struggle."""
        response = model.generate_content(prompt)
        suggestion = response.text.strip()
        if not suggestion:
            suggestion = random.choice(FALLBACKS)
    except Exception as e:
        print("Gemini error:", e)
        suggestion = random.choice(FALLBACKS)

    return jsonify({'suggestion': suggestion})