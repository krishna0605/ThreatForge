"""JWT Authentication Decorator"""
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import hashlib
from datetime import datetime, timezone
import logging

from ..supabase_client import supabase
from ..utils.auth import get_current_user_id

logger = logging.getLogger('threatforge.auth_middleware')

def auth_required(fn):
    """Custom auth decorator supporting both JWT and API key."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # 1. Check for API key first
        api_key = request.headers.get('X-API-Key')
        if api_key:
            try:
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                res = supabase.table('api_keys').select('user_id, is_active').eq('key_hash', key_hash).limit(1).execute()
                
                if res.data and res.data[0]['is_active']:
                    g.user_id = res.data[0]['user_id']
                    
                    # Update last used (Async/Fire-and-forget ideally, but sync for safety)
                    try:
                        supabase.table('api_keys').update({
                            'last_used_at': datetime.now(timezone.utc).isoformat()
                        }).eq('key_hash', key_hash).execute()
                    except Exception as e:
                        logger.warning("Failed to update API key last_used: %s", e)
                        
                    return fn(*args, **kwargs)
                else:
                    return jsonify({'error': 'Invalid or inactive API Key'}), 401

            except Exception as e:
                logger.error("API Key validation error: %s", e)
                return jsonify({'error': 'Invalid authentication mechanism'}), 401

        # 2. Fall back to JWT
        try:
            verify_jwt_in_request()
            # If successful, get_jwt_identity() will work in the endpoint
            # We also populate g.user_id for consistency
            g.user_id = get_jwt_identity()
            return fn(*args, **kwargs)
        except Exception:
             return jsonify({'error': 'Authentication required. Provide X-API-Key or Bearer token.'}), 401
    return wrapper


def admin_required(fn):
    """Require admin role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Ensure we are authenticated first
        # (This decorator is usually stacked with @auth_required, but if used alone, we need to verify)
        user_id = get_current_user_id()
        if not user_id:
             # Try to verify JWT just in case it wasn't run
             try:
                 verify_jwt_in_request()
                 user_id = get_jwt_identity()
             except Exception:
                 return jsonify({'error': 'Authentication required'}), 401

        try:
            res = supabase.table('profiles').select('role').eq('id', user_id).limit(1).execute()
            if not res.data or res.data[0].get('role') != 'admin':
                return jsonify({'error': 'Admin privileges required'}), 403
        except Exception as e:
            logger.error("Role check error: %s", e)
            return jsonify({'error': 'Authorization failed'}), 500

        return fn(*args, **kwargs)
    return wrapper
