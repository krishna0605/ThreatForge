"""API Key Management Endpoints"""
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import secrets
import hashlib
from datetime import datetime, timezone
import uuid
import logging

from . import api_bp
from ..utils.responses import success_response, error_response
from ..supabase_client import supabase

logger = logging.getLogger('threatforge.api_keys')

def hash_key(key: str) -> str:
    """SHA-256 hash of the API key."""
    return hashlib.sha256(key.encode()).hexdigest()

@api_bp.route('/api-keys', methods=['POST'])
@jwt_required()
def create_api_key():
    """Generate a new API key."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    label = data.get('label', 'Default Key')

    # Generate secure key: tf_sk_<random_hex>
    raw_key = f"tf_sk_{secrets.token_hex(24)}"
    key_hash = hash_key(raw_key)

    try:
        # Check limit (e.g., max 5 keys per user)
        count_res = supabase.table('api_keys').select('id', count='exact', head=True)\
            .eq('user_id', user_id).execute()
        if count_res.count and count_res.count >= 5:
            return error_response('API key limit reached (max 5)', 400)

        new_key = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'key_hash': key_hash,
            'label': label,
            'is_active': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_used_at': None
        }
        
        supabase.table('api_keys').insert(new_key).execute()

        # Log action
        supabase.table('activity_logs').insert({
            'user_id': user_id,
            'action': 'api_key_created',
            'resource_type': 'api_key',
            'metadata': {'label': label},
            'ip_address': request.remote_addr
        }).execute()

        return success_response({
            'api_key': raw_key,
            'label': label,
            'note': 'Store this key securely. It will not be shown again.'
        }, message='API key created', status_code=201)

    except Exception as e:
        logger.error("Failed to create API key: %s", e)
        return error_response('Internal server error', 500)


@api_bp.route('/api-keys', methods=['GET'])
@jwt_required()
def list_api_keys():
    """List user's API keys."""
    user_id = get_jwt_identity()
    try:
        res = supabase.table('api_keys').select('id, label, created_at, last_used_at, is_active')\
            .eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return success_response({'api_keys': res.data})
    except Exception as e:
        logger.error("Failed to list API keys: %s", e)
        return error_response('Internal server error', 500)


@api_bp.route('/api-keys/<key_id>', methods=['DELETE'])
@jwt_required()
def revoke_api_key(key_id):
    """Revoke (delete) an API key."""
    user_id = get_jwt_identity()
    try:
        # Verify ownership
        count_res = supabase.table('api_keys').select('id', count='exact', head=True)\
            .eq('id', key_id).eq('user_id', user_id).execute()
        
        if not count_res.count:
             return error_response('API key not found', 404)

        supabase.table('api_keys').delete().eq('id', key_id).execute()
        
        # Log action
        supabase.table('activity_logs').insert({
            'user_id': user_id,
            'action': 'api_key_revoked',
            'resource_type': 'api_key',
            'resource_id': key_id,
            'ip_address': request.remote_addr
        }).execute()

        return success_response(message='API key revoked')

    except Exception as e:
        logger.error("Failed to revoke API key: %s", e)
        return error_response('Internal server error', 500)
