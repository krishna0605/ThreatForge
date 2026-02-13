"""HTML Email Templates for ThreatForge Notifications"""


def _base_wrapper(content: str) -> str:
    """Wraps content in a consistent ThreatForge email layout."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:'Courier New',monospace;">
<div style="max-width:600px;margin:0 auto;background:#111827;border:1px solid #1f2937;">
  <!-- Header -->
  <div style="padding:24px 32px;border-bottom:1px solid #1f2937;background:#0d1117;">
    <span style="color:#008f39;font-size:18px;font-weight:bold;letter-spacing:3px;">THREAT</span><span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:3px;">FORGE</span>
    <span style="display:inline-block;margin-left:12px;padding:2px 8px;background:#008f39;color:#fff;font-size:9px;letter-spacing:2px;">SECURITY ALERT</span>
  </div>
  <!-- Body -->
  <div style="padding:32px;">
    {content}
  </div>
  <!-- Footer -->
  <div style="padding:16px 32px;border-top:1px solid #1f2937;text-align:center;">
    <p style="color:#6b7280;font-size:10px;margin:0;">© 2026 ThreatForge · Automated Security Notification</p>
    <p style="color:#4b5563;font-size:9px;margin:4px 0 0;">This email was sent because you enabled notifications in your ThreatForge settings.</p>
  </div>
</div>
</body>
</html>"""


def threat_alert_email(scan_id: str, filename: str, threat_level: str,
                       findings_count: int, top_findings: list) -> dict:
    """Generate threat alert email content."""
    color = '#ef4444' if threat_level == 'critical' else '#f59e0b'
    
    findings_html = ''
    for f in top_findings[:5]:
        sev = f.get('severity', 'unknown')
        sev_color = '#ef4444' if sev == 'critical' else '#f59e0b' if sev == 'high' else '#3b82f6'
        findings_html += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#d1d5db;font-size:12px;">{f.get('type', 'Unknown')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1f2937;">
            <span style="padding:2px 8px;background:{sev_color}20;color:{sev_color};font-size:10px;letter-spacing:1px;">{sev.upper()}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #1f2937;color:#9ca3af;font-size:11px;">{f.get('description', '')[:80]}</td>
        </tr>"""

    content = f"""
    <div style="margin-bottom:24px;">
      <span style="display:inline-block;padding:4px 12px;background:{color}20;color:{color};font-size:11px;letter-spacing:2px;font-weight:bold;border:1px solid {color}40;">
        ⚠ {threat_level.upper()} THREAT DETECTED
      </span>
    </div>

    <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0 0 16px;">
      A scan has identified <strong style="color:#fff;">{findings_count} threat(s)</strong> in the uploaded file.
    </p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#0d1117;">
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">FILE</td>
        <td style="padding:8px 12px;color:#fff;font-size:12px;">{filename}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">SCAN ID</td>
        <td style="padding:8px 12px;color:#9ca3af;font-size:11px;font-family:monospace;">{scan_id[:8]}...</td>
      </tr>
      <tr style="background:#0d1117;">
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">THREAT LEVEL</td>
        <td style="padding:8px 12px;"><span style="color:{color};font-weight:bold;">{threat_level.upper()}</span></td>
      </tr>
    </table>

    <h3 style="color:#fff;font-size:12px;letter-spacing:2px;margin:24px 0 12px;">TOP FINDINGS</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#0d1117;">
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:10px;letter-spacing:1px;">TYPE</th>
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:10px;letter-spacing:1px;">SEVERITY</th>
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:10px;letter-spacing:1px;">DETAIL</th>
      </tr>
      {findings_html}
    </table>
    """

    return {
        'subject': f'🚨 [{threat_level.upper()}] Threat detected in {filename}',
        'html': _base_wrapper(content),
    }


def scan_complete_email(scan_id: str, filename: str, total_findings: int,
                        threat_level: str, duration_seconds: float) -> dict:
    """Generate scan completion email content."""
    color = '#22c55e' if total_findings == 0 else '#f59e0b' if threat_level in ('low', 'medium') else '#ef4444'
    status = 'CLEAN' if total_findings == 0 else f'{total_findings} FINDING(S)'

    mins = int(duration_seconds // 60)
    secs = int(duration_seconds % 60)
    duration = f'{mins}m {secs}s' if mins > 0 else f'{secs}s'

    content = f"""
    <div style="margin-bottom:24px;">
      <span style="display:inline-block;padding:4px 12px;background:{color}20;color:{color};font-size:11px;letter-spacing:2px;font-weight:bold;border:1px solid {color}40;">
        ✓ SCAN COMPLETE
      </span>
    </div>

    <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0 0 16px;">
      Your file scan has completed processing. Here's a summary:
    </p>

    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#0d1117;">
        <td style="padding:10px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">FILE</td>
        <td style="padding:10px 12px;color:#fff;font-size:12px;">{filename}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">SCAN ID</td>
        <td style="padding:10px 12px;color:#9ca3af;font-size:11px;font-family:monospace;">{scan_id[:8]}...</td>
      </tr>
      <tr style="background:#0d1117;">
        <td style="padding:10px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">DURATION</td>
        <td style="padding:10px 12px;color:#9ca3af;font-size:12px;">{duration}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-size:10px;letter-spacing:1px;">RESULT</td>
        <td style="padding:10px 12px;">
          <span style="color:{color};font-weight:bold;font-size:13px;">{status}</span>
        </td>
      </tr>
    </table>
    """

    return {
        'subject': f'Scan complete: {filename} — {status}',
        'html': _base_wrapper(content),
    }


def weekly_digest_email(total_scans: int, total_threats: int,
                        critical_count: int, high_count: int,
                        recent_scans: list) -> dict:
    """Generate weekly digest email content."""
    scans_html = ''
    for s in recent_scans[:10]:
        sev = s.get('threat_level', 'clean')
        color = '#22c55e' if sev == 'clean' else '#f59e0b' if sev in ('low', 'medium') else '#ef4444'
        scans_html += f"""
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #1f2937;color:#d1d5db;font-size:11px;">{s.get('filename', 'Unknown')}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #1f2937;">
            <span style="color:{color};font-size:10px;font-weight:bold;">{sev.upper()}</span>
          </td>
          <td style="padding:6px 12px;border-bottom:1px solid #1f2937;color:#6b7280;font-size:10px;">{s.get('created_at', '')[:10]}</td>
        </tr>"""

    content = f"""
    <div style="margin-bottom:24px;">
      <span style="display:inline-block;padding:4px 12px;background:#3b82f620;color:#3b82f6;font-size:11px;letter-spacing:2px;font-weight:bold;border:1px solid #3b82f640;">
        📊 WEEKLY SECURITY DIGEST
      </span>
    </div>

    <p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0 0 24px;">
      Here's your security summary for the past 7 days.
    </p>

    <!-- Stats Grid -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="width:25%;padding:16px;text-align:center;background:#0d1117;border:1px solid #1f2937;">
          <div style="color:#3b82f6;font-size:24px;font-weight:bold;">{total_scans}</div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:2px;margin-top:4px;">SCANS</div>
        </td>
        <td style="width:25%;padding:16px;text-align:center;background:#0d1117;border:1px solid #1f2937;">
          <div style="color:#f59e0b;font-size:24px;font-weight:bold;">{total_threats}</div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:2px;margin-top:4px;">THREATS</div>
        </td>
        <td style="width:25%;padding:16px;text-align:center;background:#0d1117;border:1px solid #1f2937;">
          <div style="color:#ef4444;font-size:24px;font-weight:bold;">{critical_count}</div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:2px;margin-top:4px;">CRITICAL</div>
        </td>
        <td style="width:25%;padding:16px;text-align:center;background:#0d1117;border:1px solid #1f2937;">
          <div style="color:#f97316;font-size:24px;font-weight:bold;">{high_count}</div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:2px;margin-top:4px;">HIGH</div>
        </td>
      </tr>
    </table>

    <h3 style="color:#fff;font-size:11px;letter-spacing:2px;margin:0 0 12px;">RECENT SCANS</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#0d1117;">
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:9px;letter-spacing:1px;">FILE</th>
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:9px;letter-spacing:1px;">STATUS</th>
        <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:9px;letter-spacing:1px;">DATE</th>
      </tr>
      {scans_html}
    </table>
    """

    return {
        'subject': f'ThreatForge Weekly Digest — {total_scans} scans, {total_threats} threats',
        'html': _base_wrapper(content),
    }
