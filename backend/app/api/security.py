"""Security Settings Endpoints — Change Password, Sessions, Preferences, IP Whitelist, Audit Logs"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash
from datetime import datetime, timezone
import uuid
import logging

from ..supabase_client import supabase
from ..extensions import limiter

logger = logging.getLogger('threatforge.security')


security_bp = Blueprint('security', __name__)


# ─── Helper: parse User-Agent ───────────────────────────────────────
def parse_user_agent(ua_string: str) -> dict:
    """Extract browser and OS from User-Agent string."""
    ua = ua_string or ''
    ua_lower = ua.lower()

    # Browser detection
    browser = 'Unknown Browser'
    if 'edg/' in ua_lower or 'edge/' in ua_lower:
        browser = 'Microsoft Edge'
    elif 'opr/' in ua_lower or 'opera' in ua_lower:
        browser = 'Opera'
    elif 'chrome/' in ua_lower and 'chromium' not in ua_lower:
        browser = 'Chrome'
    elif 'firefox/' in ua_lower:
        browser = 'Firefox'
    elif 'safari/' in ua_lower and 'chrome' not in ua_lower:
        browser = 'Safari'

    # Try to get version
    for token in ['Chrome/', 'Firefox/', 'Edg/', 'OPR/', 'Safari/', 'Edge/']:
        if token in ua:
            idx = ua.index(token)
            rest = ua[idx + len(token):]
            version = rest.split(' ')[0].split('.')[0]
            if version.isdigit():
                browser += f' {version}'
            break

    # OS detection
    os_name = 'Unknown OS'
    if 'windows nt 10' in ua_lower:
        os_name = 'Windows'
    elif 'windows' in ua_lower:
        os_name = 'Windows'
    elif 'mac os x' in ua_lower or 'macintosh' in ua_lower:
        os_name = 'macOS'
    elif 'linux' in ua_lower:
        os_name = 'Linux'
    elif 'android' in ua_lower:
        os_name = 'Android'
    elif 'iphone' in ua_lower or 'ipad' in ua_lower:
        os_name = 'iOS'

    return {'browser': browser, 'os': os_name}


# ─── Helper: log audit event ───────────────────────────────────────
def log_audit(user_id: str, action: str, resource_type: str = None,
              resource_id: str = None, details: dict = None, ip: str = None):
    """Write an entry to audit_logs."""
    try:
        supabase.table('audit_logs').insert({
            'user_id': user_id,
            'action': action,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'details': details or {},
            'ip_address': ip or request.remote_addr,
        }).execute()
    except Exception as e:
        logger.error("Audit log error: %s", e)


# ═══════════════════════════════════════════════════════
#  CHANGE PASSWORD
# ═══════════════════════════════════════════════════════
@security_bp.route('/auth/change-password', methods=['PUT'])
@jwt_required()
@limiter.limit("5/minute")
def change_password():
    """Change the authenticated user's password."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400
    if len(new_password) < 8:
        return jsonify({'error': 'New password must be at least 8 characters'}), 400
    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    if current_password == new_password:
        return jsonify({'error': 'New password must be different from current'}), 400

    try:
        # Verify current password by attempting Supabase sign-in
        profile = supabase.table('profiles').select('email').eq('id', user_id).limit(1).execute()
        if not profile.data:
            return jsonify({'error': 'User not found'}), 404

        email = profile.data[0]['email']

        try:
            supabase.auth.sign_in_with_password({
                "email": email,
                "password": current_password
            })
        except Exception:
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Update password in Supabase Auth
        supabase.auth.admin.update_user_by_id(user_id, {"password": new_password})

        # Also update local hash for legacy compatibility
        supabase.table('profiles').update({
            'password_hash': generate_password_hash(new_password)
        }).eq('id', user_id).execute()

        log_audit(user_id, 'password_changed', 'profile', user_id)

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        logger.error("Failed to change password: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ═══════════════════════════════════════════════════════
#  MFA - DISABLE
# ═══════════════════════════════════════════════════════
@security_bp.route('/auth/mfa/disable', methods=['POST'])
@jwt_required()
def mfa_disable():
    """Disable 2FA for the authenticated user."""
    user_id = get_jwt_identity()
    data = request.get_json()
    totp_code = data.get('totp_code', '') if data else ''

    if not totp_code:
        return jsonify({'error': 'Current TOTP code required to disable MFA'}), 400

    try:
        import pyotp
        profile = supabase.table('profiles').select('mfa_secret, mfa_enabled').eq('id', user_id).limit(1).execute()
        if not profile.data or not profile.data[0].get('mfa_enabled'):
            return jsonify({'error': 'MFA is not enabled'}), 400

        secret = profile.data[0].get('mfa_secret')
        if not secret:
            return jsonify({'error': 'MFA secret not found'}), 400

        totp = pyotp.TOTP(secret)
        if not totp.verify(totp_code):
            return jsonify({'error': 'Invalid TOTP code'}), 401

        supabase.table('profiles').update({
            'mfa_enabled': False,
            'mfa_secret': None
        }).eq('id', user_id).execute()

        log_audit(user_id, 'mfa_disabled', 'profile', user_id)

        return jsonify({'message': 'MFA disabled successfully'}), 200

    except Exception as e:
        logger.error("Failed to disable MFA: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ═══════════════════════════════════════════════════════
#  ACTIVE SESSIONS
# ═══════════════════════════════════════════════════════
@security_bp.route('/security/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """List active sessions for the authenticated user."""
    user_id = get_jwt_identity()
    current_jti = get_jwt().get('jti', '')

    try:
        response = supabase.table('user_sessions') \
            .select('*') \
            .eq('user_id', user_id) \
            .eq('is_revoked', False) \
            .order('created_at', desc=True) \
            .limit(20) \
            .execute()

        sessions = []
        for s in response.data:
            sessions.append({
                'id': s['id'],
                'browser': s.get('browser', 'Unknown'),
                'os': s.get('os', 'Unknown'),
                'ip_address': s.get('ip_address', 'Unknown'),
                'last_active_at': s.get('last_active_at'),
                'created_at': s.get('created_at'),
                'is_current': s.get('token_jti') == current_jti,
            })

        return jsonify({'sessions': sessions}), 200

    except Exception as e:
        logger.error("Failed to get sessions: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@security_bp.route('/security/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def revoke_session(session_id):
    """Revoke a specific session."""
    user_id = get_jwt_identity()
    current_jti = get_jwt().get('jti', '')

    try:
        # Fetch the session
        response = supabase.table('user_sessions') \
            .select('*') \
            .eq('id', session_id) \
            .eq('user_id', user_id) \
            .limit(1) \
            .execute()

        if not response.data:
            return jsonify({'error': 'Session not found'}), 404

        session = response.data[0]
        if session.get('token_jti') == current_jti:
            return jsonify({'error': 'Cannot revoke your current session'}), 400

        # Mark as revoked
        supabase.table('user_sessions').update({
            'is_revoked': True
        }).eq('id', session_id).execute()

        # Add JTI to blocklist (in-memory — extensions.py will check this)
        from ..extensions import revoked_tokens
        revoked_tokens.add(session.get('token_jti'))

        log_audit(user_id, 'session_revoked', 'session', session_id,
                  details={'revoked_ip': session.get('ip_address')})

        return jsonify({'message': 'Session revoked successfully'}), 200

    except Exception as e:
        logger.error("Failed to revoke session: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ═══════════════════════════════════════════════════════
#  SECURITY PREFERENCES
# ═══════════════════════════════════════════════════════
@security_bp.route('/security/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get security preferences for the authenticated user."""
    user_id = get_jwt_identity()

    try:
        response = supabase.table('security_preferences') \
            .select('*') \
            .eq('user_id', user_id) \
            .limit(1) \
            .execute()

        if response.data:
            prefs = response.data[0]
        else:
            # Return defaults (row not yet created)
            prefs = {
                'user_id': user_id,
                'session_timeout_enabled': True,
                'session_timeout_minutes': 15,
                'ip_whitelist_enabled': False,
                'audit_logging_enabled': False,
            }

        return jsonify(prefs), 200

    except Exception as e:
        logger.error("Failed to get security preferences: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@security_bp.route('/security/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """Update security preferences (upsert)."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    allowed_fields = [
        'session_timeout_enabled', 'session_timeout_minutes',
        'ip_whitelist_enabled', 'audit_logging_enabled'
    ]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    update_data['user_id'] = user_id
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()

    try:
        supabase.table('security_preferences').upsert(update_data).execute()

        log_audit(user_id, 'preferences_updated', 'security_preferences', user_id,
                  details=update_data)

        return jsonify({'message': 'Preferences updated', **update_data}), 200

    except Exception as e:
        logger.error("Failed to update security preferences: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ═══════════════════════════════════════════════════════
#  IP WHITELIST
# ═══════════════════════════════════════════════════════
@security_bp.route('/security/ip-whitelist', methods=['GET'])
@jwt_required()
def get_ip_whitelist():
    """List IP whitelist entries for the authenticated user."""
    user_id = get_jwt_identity()

    try:
        response = supabase.table('ip_whitelist') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .execute()

        return jsonify({'entries': response.data}), 200

    except Exception as e:
        logger.error("Failed to get IP whitelist: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@security_bp.route('/security/ip-whitelist', methods=['POST'])
@jwt_required()
def add_ip_whitelist():
    """Add a CIDR range to the whitelist."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    cidr_range = data.get('cidr_range', '').strip()
    label = data.get('label', '').strip()

    if not cidr_range:
        return jsonify({'error': 'CIDR range is required'}), 400

    # Basic CIDR validation
    import ipaddress
    try:
        ipaddress.ip_network(cidr_range, strict=False)
    except ValueError:
        return jsonify({'error': 'Invalid CIDR range format (e.g. 192.168.1.0/24 or 10.0.0.1/32)'}), 400

    try:
        entry = {
            'user_id': user_id,
            'cidr_range': cidr_range,
            'label': label or None,
        }
        response = supabase.table('ip_whitelist').insert(entry).execute()

        log_audit(user_id, 'ip_whitelist_added', 'ip_whitelist', None,
                  details={'cidr_range': cidr_range, 'label': label})

        return jsonify({'message': 'IP range added', 'entry': response.data[0] if response.data else entry}), 201

    except Exception as e:
        logger.error("Failed to add IP whitelist: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@security_bp.route('/security/ip-whitelist/<entry_id>', methods=['DELETE'])
@jwt_required()
def remove_ip_whitelist(entry_id):
    """Remove a CIDR range from the whitelist."""
    user_id = get_jwt_identity()

    try:
        supabase.table('ip_whitelist') \
            .delete() \
            .eq('id', entry_id) \
            .eq('user_id', user_id) \
            .execute()

        log_audit(user_id, 'ip_whitelist_removed', 'ip_whitelist', entry_id)

        return jsonify({'message': 'IP range removed'}), 200

    except Exception as e:
        logger.error("Failed to remove IP whitelist: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ═══════════════════════════════════════════════════════
#  AUDIT LOGS
# ═══════════════════════════════════════════════════════
@security_bp.route('/security/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    """Get paginated audit logs for the authenticated user."""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # Cap at 100

    offset = (page - 1) * per_page

    try:
        response = supabase.table('audit_logs') \
            .select('*', count='exact') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .range(offset, offset + per_page - 1) \
            .execute()

        return jsonify({
            'logs': response.data,
            'total': response.count or 0,
            'page': page,
            'per_page': per_page,
        }), 200

    except Exception as e:
        logger.error("Failed to get audit logs: %s", e)
        return jsonify({'error': 'Internal server error'}), 500
