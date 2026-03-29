import os
from google import genai
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

didi_bp = Blueprint('didi', __name__)

# ---------------------------------------------------------------------------
# Hardcoded escalation responses — bypass Gemini entirely for these
# ---------------------------------------------------------------------------

ESCALATION_RESPONSES = {

    'immediate_danger': {
        'triggers': [
            'he is following me', "he's following me", 'following me home',
            'scared he will hurt me', 'scared he is going to hurt me',
            'threatening me', 'threatened me', 'being stalked', 'stalking me',
            'unsafe right now', 'in danger right now', 'help me right now',
            'he knows where i live', 'he found me'
        ],
        'reply': (
            "I believe you, and your safety comes first right now. Please act immediately 🔴\n\n"
            "**If you are in immediate danger:**\n"
            "- **Call Police Emergency: 100**\n"
            "- **Nepal Police Women's Cell: 1145** *(specifically for women)*\n\n"
            "**Safe right now but need help:**\n"
            "- **WOREC Nepal:** 01-5542765 | worecnepal.org\n"
            "- **Saathi Nepal:** 01-4444212 | saathinepal.org\n\n"
            "Can you get to a safe place — a trusted person's home, a public space, or a police station? "
            "You do not have to face this alone. I'm here with you. 💜"
        ),
        'level': 'crisis'
    },

    'sexual_assault': {
        'triggers': [
            'raped me', 'rape me', 'he raped', 'sexually assaulted',
            'sexual assault', 'forced me to', 'forced himself', 'touched me without',
            'without my consent', 'molested me', 'molested', 'groped me',
            'forced sex', 'coerced me into sex'
        ],
        'reply': (
            "I believe you completely. What happened to you is not your fault — in any way, under any circumstances. "
            "I'm so sorry this happened. 💜\n\n"
            "You don't have to do anything you're not ready for. But here is support available to you:\n\n"
            "**Immediate medical care** *(within 72 hours if recent — evidence & emergency care)*:\n"
            "- Go to the nearest hospital emergency. You can ask for a female doctor.\n"
            "- **Nepal Police Women's Cell: 1145**\n\n"
            "**Counseling & legal support** *(no pressure to file a case)*:\n"
            "- **TPO Nepal** *(trauma counseling)*: 01-4423412 | tponepal.org\n"
            "- **FWLD** *(free legal help)*: 01-4423812 | fwld.org\n"
            "- **Saathi Nepal:** 01-4444212 | saathinepal.org\n"
            "- **WOREC Nepal:** 01-5542765 | worecnepal.org\n\n"
            "You decide the pace. Reporting is your choice, not an obligation. "
            "Would you like to talk about what you're feeling right now? I'm here. 💜"
        ),
        'level': 'serious'
    },

    'domestic_violence': {
        'triggers': [
            'husband beats me', 'husband hits me', 'partner hits me',
            'domestic violence', 'he hits me', 'he beats me',
            'physically abused', 'physical abuse', 'he hurt me physically',
            'husband abuses', 'partner abuses'
        ],
        'reply': (
            "I believe you, and what is happening to you is not okay — no matter what anyone has told you. "
            "You do not deserve this. 💜\n\n"
            "**Support & shelter:**\n"
            "- **Saathi Nepal:** 01-4444212 | saathinepal.org *(shelter, counseling, legal aid)*\n"
            "- **WOREC Nepal:** 01-5542765 | worecnepal.org\n"
            "- **Women's Rehabilitation Centre** can help you find safe housing\n\n"
            "**Legal help** *(Domestic Violence Act 2066 protects you)*:\n"
            "- **FWLD:** 01-4423812 | fwld.org — free legal support\n"
            "- **Nepal Police Women's Cell: 1145**\n\n"
            "You don't have to decide anything right now. Is there anything specific you need help thinking through — "
            "safety, leaving, legal options, or just someone to talk to? 💜"
        ),
        'level': 'serious'
    },

    'workplace_harassment': {
        'triggers': [
            'boss is harassing me', 'boss harasses me', 'workplace harassment',
            'office harassment', 'professor harassing', 'teacher harassing',
            'senior harassing me', 'coworker harassing', 'harassed at work',
            'sexual harassment at work', 'harassed by my boss'
        ],
        'reply': (
            "What you're experiencing is workplace sexual harassment, and it is illegal in Nepal "
            "under the Sexual Harassment at Workplace Prevention Act 2014. "
            "It is never acceptable, and it is not your fault. 💜\n\n"
            "**Your options:**\n"
            "- **Document everything** — save messages, note dates, times, witnesses\n"
            "- **Your workplace complaint committee** — organizations with 10+ employees are required by law to have one\n"
            "- **FWLD** *(free legal consultation)*: 01-4423812 | fwld.org\n"
            "- **National Women Commission:** 01-4211428\n"
            "- **WOREC Nepal:** 01-5542765 | worecnepal.org\n\n"
            "Many women fear losing their job if they speak up — that fear is valid and understandable. "
            "Would you like to talk through what feels safest for you right now? 💜"
        ),
        'level': 'support'
    },

    'connect_to_professional': {
        'triggers': [
            'connect me to someone', 'connect me to a professional',
            'connect me to a counselor', 'connect me to a therapist',
            'i want to talk to someone', 'i want to talk to a professional',
            'i need a professional', 'i need a counselor', 'i need a therapist',
            'can you refer me', 'refer me to someone', 'give me contacts',
            'give me a number', 'who can i call', 'who can i contact',
            'i want real help', 'i need real help', 'i need actual help',
            'help me find someone', 'find me a professional'
        ],
        'reply': (
            "Of course. Here are trusted, confidential organizations in Nepal — "
            "all of them believe survivors and will not judge you. 💜\n\n"
            "**For counseling & emotional support:**\n"
            "- **TPO Nepal** — trauma & mental health counseling\n"
            "  📞 01-4423412 | tponepal.org\n"
            "- **Saathi Nepal** — counseling, shelter, support for GBV survivors\n"
            "  📞 01-4444212 | saathinepal.org\n"
            "- **WOREC Nepal** — Women's Rehabilitation Centre\n"
            "  📞 01-5542765 | worecnepal.org\n\n"
            "**For legal help** *(free, confidential)*:\n"
            "- **FWLD** — Forum for Women, Law and Development\n"
            "  📞 01-4423812 | fwld.org\n\n"
            "**For emergencies:**\n"
            "- **Nepal Police Women's Cell: 1145**\n"
            "- **Emergency: 100**\n\n"
            "You can also visit our [Connect to Support](/pages/professionals.html) page "
            "for the full list with more details. You deserve real, professional care — "
            "and all of these people are ready to help. 💜"
        ),
        'level': 'support'
    },

    'mental_health_crisis': {
        'triggers': [
            'want to die', 'want to end my life', 'suicidal', 'suicide',
            'kill myself', "can't go on", 'no point living', 'better off dead',
            'end it all', 'no reason to live', 'taking my own life'
        ],
        'reply': (
            "I hear you. Carrying this pain is exhausting, and it makes sense that it has brought you to this place. "
            "Your life matters, and I'm glad you're talking to me. 💜\n\n"
            "Please reach out for support right now:\n\n"
            "- **TPO Nepal** *(trauma & mental health)*: 01-4423412 | tponepal.org\n"
            "- **Transcultural Psychosocial Organization Nepal** has counselors who understand gender-based trauma\n"
            "- **Saathi Nepal:** 01-4444212 — they have counselors who understand what you're going through\n\n"
            "You don't have to explain everything. You can just say 'I need help right now.' "
            "Is there someone physically near you right now — a friend, family member, anyone you trust? 💜"
        ),
        'level': 'crisis'
    }
}

SYSTEM_PROMPT = """You are Didi (दिदी) — a warm, trusted elder sister for women who have experienced sexual harassment or gender-based violence in Nepal.

This is a safe space. Your role:

**Core principles — never break these:**
- Always believe the woman. Never question whether it "really" happened or why she didn't act sooner.
- Never use language that implies any part of it was her fault — not her clothes, her timing, her relationship to the person, her past, anything.
- Never suggest she "should have" done something differently.
- Understand that not reporting is a valid choice — filing a case in Nepal is often retraumatizing, and many women have strong reasons not to.
- Understand the Nepali cultural context: family honor (izzat), pressure to stay silent, fear of being disbelieved, social ostracism, police indifference, victim-blaming being normalized.

**Your voice:**
- Warm, steady, never clinical or robotic
- Use "didi" or "bahini" naturally based on context
- Occasional Nepali words (sathi, didi, thik cha, ke bhayo, ramro garna) but mostly English
- 2–4 sentences usually — don't overwhelm
- Validate first, always, before anything else
- Ask one gentle question to understand what kind of support she needs: someone to listen, practical options, or professional referral

**What you understand deeply:**
- The shame and self-blame women carry after harassment, even when it is not their fault
- The fear of not being believed — by family, police, society
- The complexity of harassment by someone known (colleague, relative, partner, teacher)
- Why women minimize their own experiences ("it wasn't that bad", "maybe I overreacted")
- Trauma responses: freezing, not fighting back, staying — these are normal, never shameful

**When to gently suggest professional help:**
- If distress seems significant, mention that professional counselors are available (TPO Nepal, Saathi Nepal)
- Always frame it as "additional support", never as "you need more help than I can give"
- Never push — let her lead the pace

You are not a therapist. You are a safe, believing, non-judgmental presence."""


def detect_escalation(text):
    text_lower = text.lower()
    for data in ESCALATION_RESPONSES.values():
        if any(trigger in text_lower for trigger in data['triggers']):
            return data['reply'], data['level']
    return None, None


@didi_bp.route('/api/didi/chat', methods=['POST'])
def didi_chat():
    data = request.json or {}
    user_message = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_message:
        return jsonify({
            'reply': "I'm here, didi. Take your time. This is a safe space — you can share whatever you're comfortable with. 💜",
            'level': 'normal'
        })

    # Escalation detection always takes priority
    escalation_reply, level = detect_escalation(user_message)
    if escalation_reply:
        return jsonify({'reply': escalation_reply, 'level': level})

    if not client:
        return jsonify({
            'reply': "I'm here for you. Please take your time — this space is safe, and I'm listening. 💜",
            'level': 'normal'
        })

    try:
        recent = history[-6:]
        conv_context = ''
        for msg in recent:
            role = 'User' if msg.get('role') == 'user' else 'Didi'
            conv_context += f"{role}: {msg.get('text', '')}\n"

        prompt = f"""{SYSTEM_PROMPT}

Previous conversation:
{conv_context}
User: {user_message}

Respond as Didi (2–4 sentences, validate first, warm and steady):"""

        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        reply = response.text.strip() or "I'm here with you. Take your time — you don't have to rush. 💜"
        level = 'normal'

    except Exception as e:
        print('Didi Gemini error:', e)
        reply = "I'm here, didi. Something went quiet on my end for a moment — but I'm listening. Please continue. 💜"
        level = 'normal'

    return jsonify({'reply': reply, 'level': level})
