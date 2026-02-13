"""Shared report endpoints — public access via share tokens."""
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..supabase_client import supabase
from ..utils.auth import get_current_user_id

shared_bp = Blueprint('shared', __name__)


@shared_bp.route('/scans/<scan_id>/share', methods=['POST'])
@jwt_required()
def create_share_link(scan_id):
    """Create a shareable link for a scan (authenticated)."""
    user_id = get_current_user_id()

    # Verify ownership
    scan_res = supabase.table('scans').select('id').eq('id', scan_id).eq('user_id', user_id).execute()
    if not scan_res.data:
        return jsonify({'error': 'Scan not found'}), 404

    # Check if active share already exists
    existing = supabase.table('shared_reports').select('share_token, expires_at') \
        .eq('scan_id', scan_id).eq('is_active', True).execute()
    
    if existing.data:
        token = existing.data[0]['share_token']
        # Determine frontend URL from request origin
        origin = request.headers.get('Origin', 'http://localhost:3000')
        return jsonify({
            'share_url': f'{origin}/report/{token}',
            'token': token,
            'expires_at': existing.data[0]['expires_at'],
            'reused': True,
        }), 200

    # Create new share token
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    supabase.table('shared_reports').insert({
        'id': str(uuid.uuid4()),
        'scan_id': scan_id,
        'user_id': user_id,
        'share_token': token,
        'expires_at': expires_at,
        'is_active': True,
    }).execute()

    origin = request.headers.get('Origin', 'http://localhost:3000')
    return jsonify({
        'share_url': f'{origin}/report/{token}',
        'token': token,
        'expires_at': expires_at,
    }), 201


@shared_bp.route('/shared/<token>', methods=['GET'])
def get_shared_report(token):
    """Get scan data via share token (NO auth required)."""
    # Look up token
    try:
        share_res = supabase.table('shared_reports').select('*') \
            .eq('share_token', token).eq('is_active', True).single().execute()
    except Exception:
        return jsonify({'error': 'Report not found or link has expired'}), 404

    if not share_res.data:
        return jsonify({'error': 'Report not found or link has expired'}), 404

    share = share_res.data

    # Check expiration
    expires_at = datetime.fromisoformat(share['expires_at'].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        # Deactivate expired token
        supabase.table('shared_reports').update({'is_active': False}).eq('id', share['id']).execute()
        return jsonify({'error': 'This share link has expired'}), 410

    scan_id = share['scan_id']

    # Fetch full scan data (same as GET /scans/<id> but without auth)
    try:
        scan_res = supabase.table('scans').select('*').eq('id', scan_id).single().execute()
    except Exception:
        return jsonify({'error': 'Scan not found'}), 404
    if not scan_res.data:
        return jsonify({'error': 'Scan not found'}), 404
    scan = scan_res.data

    files_res = supabase.table('scan_files').select('*').eq('scan_id', scan_id).execute()
    files = files_res.data

    findings_res = supabase.table('findings').select('*, rule_matches(rule_name, matched_strings)') \
        .eq('scan_id', scan_id).execute()

    formatted_findings = []
    for f in findings_res.data:
        f_dict = {
            'id': f['id'],
            'finding_type': f['finding_type'],
            'severity': f['severity'],
            'title': f['title'],
            'description': f['description'],
            'confidence': f['confidence'],
            'details': f['details'],
            'remediation': f['remediation'],
            'detected_at': f['detected_at'],
        }
        if f.get('rule_matches'):
            f_dict['rule_matches'] = f['rule_matches']
        formatted_findings.append(f_dict)

    return jsonify({
        'id': scan['id'],
        'status': scan['status'],
        'scan_type': scan['scan_type'],
        'total_files': scan['total_files'],
        'threats_found': scan['threats_found'],
        'duration_seconds': scan['duration_seconds'],
        'options': scan['options'],
        'created_at': scan['created_at'],
        'completed_at': scan['completed_at'],
        'files': files,
        'findings': formatted_findings,
        'shared_at': share['created_at'],
        'expires_at': share['expires_at'],
    }), 200
