import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import blueprints
from routes.posts import posts_bp
from routes.mood import mood_bp
from routes.ai import ai_bp
from routes.auth import auth_bp
from routes.didi import didi_bp

app = Flask(__name__)
CORS(app)  # Allow frontend to call APIs

# Register blueprints
app.register_blueprint(posts_bp)
app.register_blueprint(mood_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(didi_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)