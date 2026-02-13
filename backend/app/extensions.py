"""Flask Extension Initialization"""
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO

jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)
socketio = SocketIO()

# In-memory JWT blocklist for revoked sessions
# In production, use Redis or check the DB for is_revoked
revoked_tokens: set = set()
