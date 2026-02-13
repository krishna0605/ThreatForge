"""Notification Service — Sends emails and push notifications based on user preferences."""
import os
import json
import traceback
from datetime import datetime, timezone, timedelta

from ..supabase_client import supabase
from .email_templates import threat_alert_email, scan_complete_email, weekly_digest_email
import logging

logger = logging.getLogger('threatforge.notifications')


# ── Lazy-loaded config ──
def _resend_key():
    return os.environ.get('RESEND_API_KEY', '')

def _vapid_private():
    return os.environ.get('VAPID_PRIVATE_KEY', '')

def _vapid_public():
    return os.environ.get('VAPID_PUBLIC_KEY', '')

def _vapid_email():
    return os.environ.get('VAPID_CLAIMS_EMAIL', 'admin@threatforge.dev')

def _from_email():
    return os.environ.get('RESEND_FROM_EMAIL', 'ThreatForge <noreply@threatforge.dev>')


# ═══════════════════════════════════════════
#  INTERNAL HELPERS
# ═══════════════════════════════════════════

def _get_user_prefs(user_id: str) -> dict:
    """Fetch notification preferences (or defaults)."""
    try:
        res = supabase.table('notification_preferences') \
            .select('*').eq('user_id', user_id).limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
    return {
        'email_threat_alerts': True,
        'email_scan_completions': True,
        'email_weekly_digest': False,
        'push_critical_alerts': True,
        'push_scan_updates': False,
        'push_subscription': None,
    }


def _get_user_email(user_id: str) -> str:
    """Get user's email from profiles."""
    try:
        res = supabase.table('profiles').select('email').eq('id', user_id).limit(1).execute()
        if res.data:
            return res.data[0]['email']
    except Exception:
        pass
    return ''


def _save_notification(user_id: str, notif_type: str, channel: str,
                       title: str, message: str, metadata: dict = None):
    """Save notification to history table."""
    try:
        supabase.table('notifications').insert({
            'user_id': user_id,
            'type': notif_type,
            'channel': channel,
            'title': title,
            'message': message,
            'metadata': metadata or {},
        }).execute()
    except Exception as e:
        logger.error("Save error: %s", e)


def _send_email(to: str, subject: str, html: str):
    """Send email via Resend API."""
    api_key = _resend_key()
    if not api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    try:
        import resend
        resend.api_key = api_key
        resend.Emails.send({
            "from": _from_email(),
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Email error: %s", e)
        return False


def _send_push(subscription_info: dict, title: str, body: str, url: str = '/dashboard'):
    """Send browser push notification via pywebpush."""
    private_key = _vapid_private()
    if not private_key or not subscription_info:
        logger.warning("VAPID key or subscription missing, skipping push")
        return False
    try:
        from pywebpush import webpush
        payload = json.dumps({
            'title': title,
            'body': body,
            'icon': '/icon-192.png',
            'url': url,
        })
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=private_key,
            vapid_claims={"sub": f"mailto:{_vapid_email()}"}
        )
        logger.info("Push sent: %s", title)
        return True
    except Exception as e:
        logger.error("Push error: %s", e)
        return False


# ═══════════════════════════════════════════
#  PUBLIC API — Called by scan pipeline
# ═══════════════════════════════════════════

def notify_scan_complete(user_id: str, scan_id: str, filename: str,
                         total_findings: int, threat_level: str,
                         duration_seconds: float = 0):
    """Called after a scan finishes. Sends email + push if user has them enabled."""
    prefs = _get_user_prefs(user_id)

    # In-app notification (always)
    title = f'Scan complete: {filename}'
    message = f'{total_findings} finding(s) detected — {threat_level.upper()}'
    _save_notification(user_id, 'scan_complete', 'in_app', title, message,
                       {'scan_id': scan_id, 'threat_level': threat_level})

    # Email
    if prefs.get('email_scan_completions'):
        email = _get_user_email(user_id)
        if email:
            tmpl = scan_complete_email(scan_id, filename, total_findings,
                                       threat_level, duration_seconds)
            _send_email(email, tmpl['subject'], tmpl['html'])

    # Push
    if prefs.get('push_scan_updates') and prefs.get('push_subscription'):
        _send_push(prefs['push_subscription'], title, message, f'/scans/{scan_id}')


def notify_threat_detected(user_id: str, scan_id: str, filename: str,
                           threat_level: str, findings_count: int,
                           top_findings: list):
    """Called when critical/high threats are found. Sends urgent notifications."""
    prefs = _get_user_prefs(user_id)

    # In-app notification (always)
    title = f'⚠ {threat_level.upper()} threat in {filename}'
    message = f'{findings_count} threat(s) detected requiring immediate attention'
    _save_notification(user_id, 'threat_alert', 'in_app', title, message,
                       {'scan_id': scan_id, 'threat_level': threat_level,
                        'findings_count': findings_count})

    # Email
    if prefs.get('email_threat_alerts'):
        email = _get_user_email(user_id)
        if email:
            tmpl = threat_alert_email(scan_id, filename, threat_level,
                                       findings_count, top_findings)
            _send_email(email, tmpl['subject'], tmpl['html'])

    # Push
    if prefs.get('push_critical_alerts') and prefs.get('push_subscription'):
        _send_push(prefs['push_subscription'], title, message, f'/scans/{scan_id}')


def send_weekly_digest(user_id: str):
    """Generate and send weekly digest for a user."""
    prefs = _get_user_prefs(user_id)
    if not prefs.get('email_weekly_digest'):
        return

    email = _get_user_email(user_id)
    if not email:
        return

    # Gather stats from past 7 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    try:
        scans_res = supabase.table('scans') \
            .select('id, status, threat_level, created_at, scan_files(filename)') \
            .eq('user_id', user_id) \
            .gte('created_at', cutoff) \
            .order('created_at', desc=True) \
            .execute()
        scans = scans_res.data or []
    except Exception:
        scans = []

    total_scans = len(scans)
    total_threats = sum(1 for s in scans if s.get('threat_level') in ('critical', 'high', 'medium'))
    critical_count = sum(1 for s in scans if s.get('threat_level') == 'critical')
    high_count = sum(1 for s in scans if s.get('threat_level') == 'high')

    recent_scans = []
    for s in scans[:10]:
        files = s.get('scan_files', [])
        fname = files[0]['filename'] if files else 'Unknown'
        recent_scans.append({
            'filename': fname,
            'threat_level': s.get('threat_level', 'clean'),
            'created_at': s.get('created_at', ''),
        })

    tmpl = weekly_digest_email(total_scans, total_threats, critical_count,
                                high_count, recent_scans)
    _send_email(email, tmpl['subject'], tmpl['html'])
    _save_notification(user_id, 'weekly_digest', 'email',
                       f'Weekly Digest: {total_scans} scans, {total_threats} threats',
                       f'Your security summary for the past 7 days',
                       {'total_scans': total_scans, 'total_threats': total_threats})


def send_test_notification(user_id: str, channel: str = 'all'):
    """Send a test notification to verify setup works."""
    prefs = _get_user_prefs(user_id)
    email = _get_user_email(user_id)
    results = {'email': False, 'push': False, 'in_app': True}

    # Always save in-app
    _save_notification(user_id, 'test', 'in_app',
                       'Test Notification',
                       'This is a test — your notifications are working!',
                       {'test': True})

    # Email test
    if channel in ('all', 'email') and email:
        html = """<div style="text-align:center;padding:20px;">
        <h2 style="color:#008f39;margin:0;">✓ Email Notifications Working</h2>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px;">
        This is a test email from ThreatForge. Your email notifications are configured correctly.</p>
        </div>"""
        from .email_templates import _base_wrapper
        results['email'] = _send_email(email, 'ThreatForge — Test Notification', _base_wrapper(html))

    # Push test
    if channel in ('all', 'push') and prefs.get('push_subscription'):
        results['push'] = _send_push(
            prefs['push_subscription'],
            'ThreatForge Test',
            'Push notifications are working!',
            '/settings'
        )

    return results
