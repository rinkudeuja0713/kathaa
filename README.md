# Kathaa — Safe Space for Anonymous Stories

Kathaa is a culturally rooted, anonymous storytelling and mood-tracking experience built for South Asian communities that still face stigma around mental health. It combines a soothing static front-end with a lightweight Flask API so people can share their kathaa (stories), log moods, and receive gentle AI-powered affirmations.

## ✨ Features

- **Anonymous story feed** – Share short posts with emotion tags, read others' experiences, and see "similar hearts" counts.
- **Mood tracker** – Log today's mood, visualize the past week, and keep a private journal of emotional weather.
- **AI validation toast** – Each post triggers a short, compassionate suggestion (Gemini fallback messages when offline).
- **Profile hub** – View your story count, mood entries, and recent activity in one warm dashboard.
- **Friendly UI** – Typography, gradients, and subtle diya motifs to reflect warmth and cultural familiarity.

## 🗂 Project structure

```
kathaa/
├── index.html            # Landing page
├── pages/
│   ├── feed.html        # Story feed & composer
│   ├── tracker.html     # Mood tracker UI
│   ├── profile.html     # Personal summary (stories + moods)
│   └── login.html       # Placeholder auth page (front-end only)
├── js/
│   ├── api.js          # Fetch helpers (GET/POST) to Flask backend
│   ├── auth.js         # Anonymous ID helper & mock auth flows
│   ├── posts.js        # LocalStorage mirror for posts (profile counters)
│   ├── moodTracker.js  # Mood logging + last-7-days helper
│   └── aiSuggestions.js# Front-end fallback suggestions
├── css/
│   ├── styles.css
│   └── responsive.css
└── backend/
    ├── app.py                 # Flask entrypoint
    ├── requirements.txt       # Backend deps (Flask, CORS, dotenv, google-generativeai)
    ├── routes/
    │   ├── posts.py           # CRUD & filters for stories
    │   ├── mood.py            # Mood log endpoints
    │   ├── ai.py              # Gemini + fallback suggestions
    │   └── auth.py            # Minimal signup/login mock
    ├── data/storage.json      # Simple JSON persistence for posts + moods
    └── .env.example           # Sample env vars (Gemini API key placeholder)
```

## 🚀 Running the project

### 1. Front-end (static)
You can serve the static files with any HTTP server. Two quick options:

```powershell
cd "d:\NP-US hackathon\kathaa"
python -m http.server 8000
```
or, if you have Node:

```powershell
cd "d:\NP-US hackathon\kathaa"
npx serve . -l 8000
```
Then visit `http://localhost:8000` for the landing page, `http://localhost:8000/pages/feed.html` for the feed, etc.

### 2. Backend (Flask API)

```powershell
cd "d:\NP-US hackathon\kathaa\backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY if you have one
python app.py
```
The API runs on `http://localhost:5000` with endpoints:

- `GET/POST /api/posts`
- `GET /api/posts/user/<userId>`
- `GET /api/posts/tag/<tag>`
- `GET/POST /api/moods`
- `GET /api/moods/user/<userId>`
- `POST /api/ai/suggest`
- `POST /api/auth/(signup|login|reset)` (demo only)

## 🔑 Secrets & configuration

- Copy `.env.example` to `.env` in `backend/` and provide `GEMINI_API_KEY` if you want live AI suggestions.
- Without the key, `ai.py` automatically falls back to curated supportive messages, so the app still works offline.

## 🧪 Testing the flow

1. Start backend and frontend servers as shown above.
2. Go to `/pages/feed.html`, share a story with tags.
   - You’ll see a toast instantly (“Holding your kathaa safely...”) followed by the AI suggestion.
   - The profile page’s “Stories shared” counter increments because posts are mirrored to `localStorage`.
3. Visit `/pages/tracker.html`, select a mood, and click “Log today’s mood.”
   - The chart refreshes and `localStorage` captures the log. Profile’s “Mood entries” increases.
4. `/pages/profile.html` shows your anonymous ID, story and mood counts, plus recent history.

## 📦 Deployment notes

This repo includes Firebase hosting config (.firebaserc, firebase.json). If you want to redeploy:

```powershell
cd "d:\NP-US hackathon\kathaa"
firebase login
firebase deploy
```
(Ensure your Firebase project is configured in `.firebaserc`).

For the backend, consider deploying to Render, Railway, or Azure App Service; it’s a plain Flask app without database dependencies.

## 🤝 Contributing / next steps

- Replace LocalStorage user handling with real auth (e.g., Firebase Auth or Supabase).
- Swap JSON persistence for a managed DB (Postgres/Dynamo/etc.) if scaling beyond prototypes.
- Harden the AI endpoint with rate limiting and user-friendly fallbacks when the model fails.
- Add proper unit tests for Flask routes and front-end utilities.

## License

MIT or appropriate license (add details here if different). Feel free to adapt Kathaa for community well-being projects.
