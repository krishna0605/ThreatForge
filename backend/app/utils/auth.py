from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import logging

logger = logging.getLogger('threatforge.auth_utils')

def get_current_user_id() -> str:
    """
    Get the authenticated user's ID.
    Supports both JWT (flask-jwt-extended) and API Key (stored in g.user_id).
    """
    # 1. Check if API Key auth already set the user in g
    if hasattr(g, 'user_id') and g.user_id:
        return g.user_id

    # 2. Check JWT
    try:
        verify_jwt_in_request(optional=True) # Check if JWT is present, don't crash if not
        identity = get_jwt_identity()
        if identity:
            return identity
    except Exception:
        pass
    
    # 3. Fallback/Error
    return None
