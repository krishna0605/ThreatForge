"""Dashboard Endpoints — Supabase Implementation"""
from datetime import datetime, timedelta, timezone
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

from . import api_bp
from ..supabase_client import supabase
from ..utils.auth import get_current_user_id

logger = logging.getLogger('threatforge.dashboard')

@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get aggregated stats for the dashboard."""
    user_id = get_current_user_id()

    try:
        # 1. Total Scans
        total_scans_res = supabase.table('scans').select('id', count='exact', head=True)\
            .eq('user_id', user_id).execute()
        total_scans = total_scans_res.count if total_scans_res.count is not None else 0

        # 2. Threats Found & Clean Files
        scans_res = supabase.table('scans').select('threats_found').eq('user_id', user_id).execute()
        
        total_threats = 0
        clean_files = 0
        
        if scans_res.data:
            for s in scans_res.data:
                threats = s.get('threats_found', 0)
                total_threats += threats
                if threats == 0:
                    clean_files += 1

        # 3. Critical Alerts
        critical_res = supabase.table('findings').select('id, scans!inner(user_id)', count='exact', head=True)\
            .eq('severity', 'critical')\
            .eq('scans.user_id', user_id)\
            .execute()
        
        critical_alerts = critical_res.count if critical_res.count is not None else 0

        return jsonify({
            'total_scans': total_scans,
            'threats_found': total_threats,
            'clean_files': clean_files,
            'critical_alerts': critical_alerts
        }), 200

    except Exception as e:
        logger.error("Failed to get dashboard stats: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/dashboard/activity', methods=['GET'])
@jwt_required()
def get_dashboard_activity():
    """Get scan activity for the last 7 days."""
    user_id = get_current_user_id()

    try:
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=6) # 7 days inclusive
        
        # Fetch scans created after start_date
        scans_res = supabase.table('scans').select('created_at')\
            .eq('user_id', user_id)\
            .gte('created_at', start_date.isoformat())\
            .execute()

        # Initialize map for last 7 days
        activity_map = {}
        for i in range(7):
            day = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
            activity_map[day] = 0
            
        # Aggregate
        if scans_res.data:
            for s in scans_res.data:
                created_at = s['created_at'][:10]
                if created_at in activity_map:
                    activity_map[created_at] += 1
        
        # Format for Chart.js
        labels = [] # Mon, Tue... or dates
        data = []
        
        # Sort by date
        sorted_dates = sorted(activity_map.keys())
        for date_str in sorted_dates:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            labels.append(dt.strftime('%a')) # Mon, Tue
            data.append(activity_map[date_str])

        return jsonify({
            'labels': labels,
            'data': data
        }), 200

    except Exception as e:
        logger.error("Failed to get dashboard activity: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/dashboard/threat-distribution', methods=['GET'])
@jwt_required()
def get_threat_distribution():
    """Get distribution of threats by type."""
    user_id = get_current_user_id()

    try:
        findings_res = supabase.table('findings').select('finding_type, scans!inner(user_id)')\
            .eq('scans.user_id', user_id)\
            .execute()
            
        dist = {
            'malware': 0,
            'steganography': 0,
            'network': 0,
            'yara': 0,
            'other': 0
        }
        
        if findings_res.data:
            for f in findings_res.data:
                ftype = f.get('finding_type', 'other').lower()
                if ftype in dist:
                    dist[ftype] += 1
                else:
                    dist['other'] += 1
        
        labels = ['Malware', 'Steganography', 'Network', 'YARA/Other']
        data = [
            dist['malware'], 
            dist['steganography'], 
            dist['network'], 
            dist['yara'] + dist['other']
        ]
        
        return jsonify({
            'labels': labels,
            'data': data
        }), 200

    except Exception as e:
        logger.error("Failed to get threat distribution: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/dashboard/security-health', methods=['GET'])
@jwt_required()
def get_security_health():
    """Compute system security health gauges from real data."""
    user_id = get_current_user_id()

    try:
        # Network Integrity
        all_scans = supabase.table('scans').select('status', count='exact', head=False)\
            .eq('user_id', user_id).execute()
        total = len(all_scans.data) if all_scans.data else 0
        failed = sum(1 for s in (all_scans.data or []) if s.get('status') == 'failed')
        network_val = round(((total - failed) / total) * 100) if total > 0 else 95

        network_subtitle = 'Stable Connection' if network_val >= 80 else 'Degraded' if network_val >= 50 else 'Critical'

        # AI Model Confidence
        findings_res = supabase.table('findings').select('confidence, scans!inner(user_id)')\
            .eq('scans.user_id', user_id)\
            .not_.is_('confidence', 'null')\
            .order('detected_at', desc=True)\
            .limit(50)\
            .execute()

        if findings_res.data and len(findings_res.data) > 0:
            confidences = [f['confidence'] for f in findings_res.data if f.get('confidence') is not None]
            ai_val = round((sum(confidences) / len(confidences)) * 100) if confidences else 85
        else:
            ai_val = 85

        ai_subtitle = 'Learning Active' if ai_val >= 70 else 'Retraining Needed'

        # Firewall Status
        clean_count = sum(1 for s in (all_scans.data or []) if s.get('status') == 'completed')
        threats_count = sum(1 for s in (all_scans.data or [])
                           if s.get('status') == 'completed' and s.get('threats_found', 0) > 0) if all_scans.data else 0
        if clean_count > 0:
            firewall_val = round(((clean_count - threats_count) / clean_count) * 100)
        else:
            firewall_val = 100

        firewall_subtitle = 'All Clear' if firewall_val >= 90 else 'Optimization Required' if firewall_val >= 50 else 'Action Required'

        return jsonify({
            'network_integrity': {'value': max(0, min(network_val, 100)), 'label': 'Network Integrity', 'subtitle': network_subtitle},
            'ai_confidence': {'value': max(0, min(ai_val, 100)), 'label': 'AI Model Confidence', 'subtitle': ai_subtitle},
            'firewall_status': {'value': max(0, min(firewall_val, 100)), 'label': 'Firewall Status', 'subtitle': firewall_subtitle},
        }), 200

    except Exception as e:
        logger.error("Failed to get security health: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/dashboard/severity-breakdown', methods=['GET'])
@jwt_required()
def get_severity_breakdown():
    """Get severity counts from actual findings."""
    user_id = get_current_user_id()

    try:
        findings_res = supabase.table('findings').select('severity, scans!inner(user_id)')\
            .eq('scans.user_id', user_id)\
            .execute()

        counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        if findings_res.data:
            for f in findings_res.data:
                sev = f.get('severity', 'info').lower()
                if sev in counts:
                    counts[sev] += 1

        total = sum(counts.values()) or 1
        breakdown = [
            {'level': 'Critical', 'count': counts['critical'], 'pct': round((counts['critical'] / total) * 100)},
            {'level': 'High',     'count': counts['high'],     'pct': round((counts['high'] / total) * 100)},
            {'level': 'Medium',   'count': counts['medium'],   'pct': round((counts['medium'] / total) * 100)},
            {'level': 'Low',      'count': counts['low'],      'pct': round((counts['low'] / total) * 100)},
        ]

        return jsonify({'breakdown': breakdown}), 200

    except Exception as e:
        logger.error("Failed to get severity breakdown: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/dashboard/security-actions', methods=['GET'])
@jwt_required()
def get_security_actions():
    """Generate smart recommended security actions."""
    user_id = get_current_user_id()

    try:
        actions = []

        # 1. Check YARA rules staleness
        rules_res = supabase.table('yara_rules').select('updated_at')\
            .eq('user_id', user_id).order('updated_at', desc=True).limit(1).execute()

        if rules_res.data:
            last_update = rules_res.data[0].get('updated_at', '')
            if last_update:
                last_dt = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                days_old = (datetime.now(timezone.utc) - last_dt).days
                if days_old > 3:
                    actions.append({
                        'id': 'yara_update',
                        'icon': 'update',
                        'title': 'Update YARA rules database',
                        'desc': f'Database is {days_old} days out of date.',
                        'type': 'yara_update',
                    })
        else:
            actions.append({
                'id': 'yara_update',
                'icon': 'update',
                'title': 'Update YARA rules database',
                'desc': 'No custom YARA rules found. Consider adding some.',
                'type': 'yara_update',
            })

        # 2. Check for unresolved critical findings
        critical_res = supabase.table('findings').select('id, title, scans!inner(user_id)', count='exact', head=False)\
            .eq('severity', 'critical')\
            .eq('scans.user_id', user_id)\
            .limit(3)\
            .execute()

        if critical_res.data and len(critical_res.data) > 0:
            for finding in critical_res.data[:2]:
                actions.append({
                    'id': f'fix_{finding["id"]}',
                    'icon': 'security',
                    'title': f'Resolve: {finding.get("title", "Critical finding")}',
                    'desc': 'Critical severity finding requires immediate attention.',
                    'type': 'resolve_finding',
                })

        # 3. Check API key rotation
        keys_res = supabase.table('api_keys').select('created_at')\
            .eq('user_id', user_id).order('created_at', desc=True).limit(1).execute()

        if keys_res.data:
            key_created = keys_res.data[0].get('created_at', '')
            if key_created:
                key_dt = datetime.fromisoformat(key_created.replace('Z', '+00:00'))
                key_age = (datetime.now(timezone.utc) - key_dt).days
                if key_age > 30:
                    actions.append({
                        'id': 'rotate_keys',
                        'icon': 'vpn_key',
                        'title': 'Rotate API Keys for External Scanners',
                        'desc': f'Keys are {key_age} days old. Scheduled rotation recommended.',
                        'type': 'key_rotation',
                    })

        # Fallback if no real actions detected
        if not actions:
            actions.append({
                'id': 'all_clear',
                'icon': 'check_circle',
                'title': 'All systems operational',
                'desc': 'No immediate actions required. Continue monitoring.',
                'type': 'info',
            })

        return jsonify({'actions': actions}), 200

    except Exception as e:
        logger.error("Failed to get security actions: %s", e)
        return jsonify({'error': 'Internal server error'}), 500
