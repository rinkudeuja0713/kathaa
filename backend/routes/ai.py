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
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    model = None

ai_bp = Blueprint('ai', __name__)

# Fallback suggestions (rotates randomly) — for Nepali women sharing experiences of harassment, abuse, and silence
FALLBACKS = [
    "What happened to you was not your fault. The shame was never yours to carry — it belongs to those who hurt you.",
    "You just did something incredibly brave. Speaking it, even anonymously, even once — that matters. You are believed here.",
    "So many women carry this exact weight in silence. You are not alone in this, even when it feels that way.",
    "You did nothing wrong. The way you dressed, where you were, what you said — none of it invited what happened to you.",
    "The people who told you to stay quiet were protecting themselves, not you. Your truth deserves to be heard.",
    "You are not weak for staying. You are not stupid for trusting. You are not to blame for any of this.",
    "Healing is not linear and it does not have a deadline. Be as gentle with yourself today as you would be with someone you love.",
    "You survived something real. Writing it here took courage. You are seen, and you are not alone.",
    "What was done to you was wrong. Full stop. You deserved — and still deserve — to be safe.",
    "Your story matters. Not just for you, but for every woman who reads it and feels less alone because of your courage."
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
        prompt = f"""You are a compassionate, trauma-informed listener on Kathaa — a safe anonymous platform for Nepali women to share experiences of harassment, sexual violence, domestic abuse, and being silenced or blamed.

Someone just shared: "{user_text}"

Write a warm, validating response (2-3 sentences, max 70 words) that:
- Affirms that what happened was not their fault
- Acknowledges their specific experience without minimising it
- Reminds them they are not alone and they are believed
- Does NOT give clinical advice, legal instructions, or tell them what to do
- Does NOT use "Sathi" — speak to them directly and warmly as an equal
- Sounds like a trusted woman who truly understands, not a helpline script"""
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