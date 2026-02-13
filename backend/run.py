"""Flask App Entry Point"""
import os
from dotenv import load_dotenv
load_dotenv()

from validate_env import validate
errors = validate()
if errors:
    print("❌ Environment validation failed:")
    for e in errors:
        print(e)
    if os.getenv('FLASK_CONFIG') == 'production':
        import sys
        sys.exit(1)

from app import create_app
from app.config import config_by_name
from app.extensions import socketio

config_name = os.getenv('FLASK_CONFIG', 'development')
app = create_app(config_by_name[config_name])

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
