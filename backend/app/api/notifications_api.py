"""Notifications API — Preferences, history, push subscription, test"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import logging

from ..supabase_client import supabase
from ..services.notifications import send_test_notification, send_weekly_digest

logger = logging.getLogger('threatforge.notifications_api')

notifications_bp = Blueprint('notifications', __name__)


# ── Preferences ──────────────────────────────────

@notifications_bp.route('/notifications/preferences', methods=['GET'])
@jwt_required()
def get_notification_prefs():
    """Get user's notification preferences."""
    user_id = get_jwt_identity()
    try:
        res = supabase.table('notification_preferences') \
            .select('*').eq('user_id', user_id).limit(1).execute()
        if res.data:
            prefs = res.data[0]
            # Don't expose push subscription details to frontend
            prefs.pop('push_subscription', None)
            return jsonify(prefs), 200
        # Return defaults
        return jsonify({
            'user_id': user_id,
            'email_threat_alerts': True,
            'email_scan_completions': True,
            'email_weekly_digest': False,
            'push_critical_alerts': True,
            'push_scan_updates': False,
        }), 200
    except Exception as e:
        logger.error("Failed to get preferences: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@notifications_bp.route('/notifications/preferences', methods=['PUT'])
@jwt_required()
def update_notification_prefs():
    """Update notification preferences."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    allowed_fields = [
        'email_threat_alerts', 'email_scan_completions', 'email_weekly_digest',
        'push_critical_alerts', 'push_scan_updates',
    ]
    update = {k: v for k, v in data.items() if k in allowed_fields}
    update['updated_at'] = datetime.now(timezone.utc).isoformat()

    try:
        # Check if row exists
        existing = supabase.table('notification_preferences') \
            .select('user_id').eq('user_id', user_id).limit(1).execute()

        if existing.data:
            supabase.table('notification_preferences') \
                .update(update).eq('user_id', user_id).execute()
        else:
            update['user_id'] = user_id
            supabase.table('notification_preferences').insert(update).execute()

        return jsonify({'message': 'Preferences updated'}), 200
    except Exception as e:
        logger.error("Failed to update preferences: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ── Notification History ─────────────────────────

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notification history (paginated)."""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    offset = (page - 1) * per_page

    try:
        res = supabase.table('notifications') \
            .select('*', count='exact') \
            .eq('user_id', user_id) \
            .order('created_at', desc=True) \
            .range(offset, offset + per_page - 1) \
            .execute()

        return jsonify({
            'notifications': res.data or [],
            'total': res.count or 0,
            'page': page,
            'per_page': per_page,
        }), 200
    except Exception as e:
        logger.error("Failed to get notifications: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    """Get unread notification count."""
    user_id = get_jwt_identity()
    try:
        res = supabase.table('notifications') \
            .select('id', count='exact') \
            .eq('user_id', user_id) \
            .eq('is_read', False) \
            .execute()
        return jsonify({'count': res.count or 0}), 200
    except Exception as e:
        logger.error("Failed to get unread count: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@notifications_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id):
    """Mark a single notification as read."""
    user_id = get_jwt_identity()
    try:
        supabase.table('notifications') \
            .update({'is_read': True}) \
            .eq('id', notification_id) \
            .eq('user_id', user_id) \
            .execute()
        return jsonify({'message': 'Marked as read'}), 200
    except Exception as e:
        logger.error("Failed to mark notification read: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read."""
    user_id = get_jwt_identity()
    try:
        supabase.table('notifications') \
            .update({'is_read': True}) \
            .eq('user_id', user_id) \
            .eq('is_read', False) \
            .execute()
        return jsonify({'message': 'All marked as read'}), 200
    except Exception as e:
        logger.error("Failed to mark all read: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ── Push Subscription ────────────────────────────

@notifications_bp.route('/notifications/push/subscribe', methods=['POST'])
@jwt_required()
def push_subscribe():
    """Store the browser's push subscription object."""
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    subscription = data.get('subscription')

    if not subscription:
        return jsonify({'error': 'subscription object required'}), 400

    try:
        existing = supabase.table('notification_preferences') \
            .select('user_id').eq('user_id', user_id).limit(1).execute()

        if existing.data:
            supabase.table('notification_preferences') \
                .update({'push_subscription': subscription,
                         'updated_at': datetime.now(timezone.utc).isoformat()}) \
                .eq('user_id', user_id).execute()
        else:
            supabase.table('notification_preferences').insert({
                'user_id': user_id,
                'push_subscription': subscription,
            }).execute()

        return jsonify({'message': 'Push subscription saved'}), 200
    except Exception as e:
        logger.error("Failed to subscribe push: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@notifications_bp.route('/notifications/push/unsubscribe', methods=['POST'])
@jwt_required()
def push_unsubscribe():
    """Remove push subscription."""
    user_id = get_jwt_identity()
    try:
        supabase.table('notification_preferences') \
            .update({'push_subscription': None,
                     'updated_at': datetime.now(timezone.utc).isoformat()}) \
            .eq('user_id', user_id).execute()
        return jsonify({'message': 'Push subscription removed'}), 200
    except Exception as e:
        logger.error("Failed to unsubscribe push: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


# ── Test & Weekly Digest ─────────────────────────

@notifications_bp.route('/notifications/test', methods=['POST'])
@jwt_required()
def test_notification():
    """Send a test notification to verify setup."""
    user_id = get_jwt_identity()
    channel = (request.get_json() or {}).get('channel', 'all')
    results = send_test_notification(user_id, channel)
    return jsonify({'message': 'Test sent', 'results': results}), 200


@notifications_bp.route('/notifications/weekly-digest', methods=['POST'])
@jwt_required()
def trigger_weekly_digest():
    """Manually trigger weekly digest (for testing)."""
    user_id = get_jwt_identity()
    send_weekly_digest(user_id)
    return jsonify({'message': 'Weekly digest sent'}), 200
