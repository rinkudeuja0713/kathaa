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
from routes.groups import groups_bp
from routes.chautari import chautari_bp

app = Flask(__name__)
# Aggressive CORS configuration
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Register blueprints
app.register_blueprint(posts_bp)
app.register_blueprint(mood_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(didi_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(chautari_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5001)