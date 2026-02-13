"""Scan Endpoints — Supabase Implementation"""
import os
import uuid
from datetime import datetime, timezone
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import json
import logging

from . import api_bp
from ..supabase_client import supabase
from ..models.scan import ScanModel, ScanFileModel
from ..models.finding import FindingModel, RuleMatchModel
from ..services.scanner import ScanOrchestrator
from ..utils.responses import success_response, error_response
from ..utils.auth import get_current_user_id

logger = logging.getLogger('threatforge.scans')


ALLOWED_EXTENSIONS = {
    'exe', 'dll', 'bin', 'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'zip', 'rar', '7z', 'js', 'py', 'ps1', 'bat', 'sh',
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'wav', 'mp3',
    'pcap', 'pcapng', 'csv', 'json', 'xml', 'txt',
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api_bp.route('/scans', methods=['POST'])
@jwt_required()
def create_scan():
    """Create a new scan with file upload."""
    user_id = get_current_user_id()

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded. Use form field name "file"'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400

    # Parse options from form data
    scan_type = request.form.get('scan_type', 'full')
    enable_ml = request.form.get('enable_ml', 'true').lower() == 'true'
    enable_yara = request.form.get('enable_yara', 'true').lower() == 'true'
    enable_stego = request.form.get('enable_stego', 'true').lower() == 'true'
    enable_pcap = request.form.get('enable_pcap', 'false').lower() == 'true'
    enable_entropy = request.form.get('enable_entropy', 'true').lower() == 'true'
    enable_pe = request.form.get('enable_pe', 'true').lower() == 'true'
    yara_ruleset = request.form.get('yara_ruleset', 'all')
    priority = request.form.get('priority', 'normal')

    # Save file
    upload_folder = current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads')
    os.makedirs(upload_folder, exist_ok=True)
    scan_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename)
    file_path = os.path.join(upload_folder, f'{scan_id}_{safe_name}')
    file.save(file_path)

    try:
        # Create DB record: Scan using Pydantic
        scan_model = ScanModel(
            id=uuid.UUID(scan_id),
            user_id=uuid.UUID(user_id),
            status='running',
            scan_type=scan_type,
            total_files=1,
            options={
                'enable_ml': enable_ml, 'enable_yara': enable_yara,
                'enable_stego': enable_stego, 'enable_pcap': enable_pcap,
                'enable_entropy': enable_entropy, 'enable_pe': enable_pe,
                'yara_ruleset': yara_ruleset, 'priority': priority,
            },
            created_at=datetime.now(timezone.utc)
        )
        supabase.table('scans').insert(scan_model.to_dict(exclude={'files'})).execute()

        # Create DB record: ScanFile using Pydantic
        scan_file_id = str(uuid.uuid4())
        scan_file_model = ScanFileModel(
            id=uuid.UUID(scan_file_id),
            scan_id=uuid.UUID(scan_id),
            filename=safe_name,
            file_size=os.path.getsize(file_path),
            storage_path=file_path,
            uploaded_at=datetime.now(timezone.utc)
        )
        supabase.table('scan_files').insert(scan_file_model.to_dict()).execute()

        # Run scan synchronously (for Phase 3)
        orchestrator = ScanOrchestrator()
        
        # Get enabled YARA rules
        yara_rules = []
        if enable_yara:
            # Try to fetch enabled rules from Supabase
            try:
                # We need to filter by user_id OR is_builtin=true.
                # Supabase simple filtering is AND by default.
                # Complex OR queries can be done via .or_() syntax:
                # .or_(f"user_id.eq.{user_id},is_builtin.eq.true")
                rules_query = supabase.table('yara_rules').select('name, rule_content, category')\
                    .eq('is_enabled', True)\
                    .or_(f"user_id.eq.{user_id},is_builtin.eq.true")
                
                # Filter by YARA ruleset category
                if yara_ruleset and yara_ruleset != 'all':
                    rules_query = rules_query.eq('category', yara_ruleset)
                
                rules_res = rules_query.execute()
                
                if rules_res.data:
                    yara_rules = [{'name': r['name'], 'content': r['rule_content']} for r in rules_res.data]
            except Exception as e:
                logger.error("Error fetching rules: %s", e)

        ml_url = current_app.config.get('ML_SERVICE_URL')
        results = orchestrator.run_scan(
            file_path=file_path,
            options={
                'enable_ml': enable_ml,
                'enable_yara': enable_yara,
                'enable_stego': enable_stego,
                'enable_pcap': enable_pcap,
                'enable_entropy': enable_entropy,
                'enable_pe': enable_pe,
            },
            yara_rules=yara_rules if enable_yara else [],
            ml_service_url=ml_url,
        )

        # Update scan_file with metadata
        # Partial update, no need for full model here usually, but we can stick to dict for updates 
        # as Pydantic is best for full record creation or validation.
        supabase.table('scan_files').update({
            'file_hash_sha256': results['metadata'].get('sha256'),
            'mime_type': results['metadata'].get('mime_type'),
            'entropy': results.get('entropy')
        }).eq('id', scan_file_id).execute()

        # Create Finding records
        threats = 0
        findings_to_insert = []
        rule_matches_to_insert = []

        for f_data in results.get('findings', []):
            finding_id = str(uuid.uuid4())
            
            # Validate with Pydantic
            finding_model = FindingModel(
                id=uuid.UUID(finding_id),
                scan_id=uuid.UUID(scan_id),
                scan_file_id=uuid.UUID(scan_file_id),
                finding_type=f_data['finding_type'],
                severity=f_data['severity'],
                title=f_data['title'],
                description=f_data.get('description'),
                confidence=f_data.get('confidence'),
                details=f_data.get('details', {}),
                remediation=f_data.get('remediation'),
                detected_at=datetime.now(timezone.utc)
            )
            findings_to_insert.append(finding_model.to_dict(exclude={'rule_matches'}))

            if f_data['severity'] in ('critical', 'high', 'medium'):
                threats += 1
            
            # Prepare rule matches
            if f_data['finding_type'] == 'yara' and 'match' in f_data.get('details', {}):
                match_data = f_data['details']['match']
                rule_match_model = RuleMatchModel(
                    id=uuid.uuid4(),
                    finding_id=uuid.UUID(finding_id),
                    rule_name=match_data.get('rule_name', 'unknown'),
                    matched_strings=match_data.get('matched_strings', [])
                )
                rule_matches_to_insert.append(rule_match_model.to_dict())

        # Batch insert findings
        if findings_to_insert:
            supabase.table('findings').insert(findings_to_insert).execute()
        
        # Batch insert rule matches
        if rule_matches_to_insert:
             supabase.table('rule_matches').insert(rule_matches_to_insert).execute()

        # Update scan status
        supabase.table('scans').update({
            'status': 'completed',
            'threats_found': threats,
            'duration_seconds': results.get('duration_seconds', 0),
            'completed_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', scan_id).execute()

        # Log activity
        supabase.table('activity_logs').insert({
            'user_id': user_id,
            'action': 'scan_created',
            'resource_type': 'scan',
            'resource_id': scan_id,
            'metadata': {'filename': safe_name, 'threats': threats},
            'ip_address': request.remote_addr
        }).execute()

        # ── Notifications ──
        try:
            from ..services.notifications import notify_scan_complete, notify_threat_detected

            # Determine overall threat level
            severities = [f.get('severity', 'low') for f in results.get('findings', [])]
            if 'critical' in severities:
                threat_level = 'critical'
            elif 'high' in severities:
                threat_level = 'high'
            elif 'medium' in severities:
                threat_level = 'medium'
            else:
                threat_level = 'clean'

            # Always notify scan complete
            notify_scan_complete(
                user_id, scan_id, safe_name,
                len(results.get('findings', [])),
                threat_level,
                results.get('duration_seconds', 0)
            )

            # Notify if critical/high threats found
            if threat_level in ('critical', 'high'):
                notify_threat_detected(
                    user_id, scan_id, safe_name,
                    threat_level, threats,
                    results.get('findings', [])[:5]
                )
        except Exception as notif_err:
            logger.warning("Notification error (non-fatal): %s", notif_err)

        return jsonify({
            'scan_id': scan_id,
            'status': 'completed',
            'filename': safe_name,
            'threats_found': threats,
            'threat_score': results.get('threat_score', 0),
            'duration_seconds': results.get('duration_seconds', 0),
            'findings_count': len(results.get('findings', [])),
        }), 201

    except Exception as e:
        logger.error("Scan failed: %s", e)
        # Update scan status to failed
        try:
             supabase.table('scans').update({'status': 'failed'}).eq('id', scan_id).execute()
        except:
             pass
        # We return the scan_id so client can poll for status 'failed'
        return jsonify({'error': 'Scan failed internal error', 'scan_id': scan_id}), 500


@api_bp.route('/scans', methods=['GET'])
@jwt_required()
def list_scans():
    """List user's scans with pagination."""
    user_id = get_current_user_id()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    order = request.args.get('order', 'desc')
    
    per_page = min(per_page, 50)
    start = (page - 1) * per_page
    end = start + per_page - 1

    try:
        query = supabase.table('scans').select('*, scan_files(filename)', count='exact')\
            .eq('user_id', user_id)

        if status_filter:
            query = query.eq('status', status_filter)

        # Sorting
        query = query.order('created_at', desc=(order == 'desc'))
        
        # Pagination
        query = query.range(start, end)
        
        result = query.execute()
        scans = result.data
        total_count = result.count if result.count is not None else len(scans)

        # Format response
        scans_data = []
        for s in scans:
            filename = None
            if s.get('scan_files') and len(s['scan_files']) > 0:
                filename = s['scan_files'][0]['filename']
            
            scans_data.append({
                'id': s['id'],
                'status': s['status'],
                'scan_type': s['scan_type'],
                'total_files': s['total_files'],
                'threats_found': s['threats_found'],
                'duration_seconds': s['duration_seconds'],
                'filename': filename,
                'created_at': s['created_at'],
                'completed_at': s['completed_at']
            })

        return jsonify({
            'scans': scans_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'pages': (total_count + per_page - 1) // per_page,
                'has_next': end < total_count - 1,
                'has_prev': page > 1,
            },
        }), 200
    except Exception as e:
        logger.error("Failed to list scans: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/scans/<scan_id>', methods=['GET'])
@jwt_required()
def get_scan(scan_id):
    """Get full scan details with findings."""
    user_id = get_current_user_id()
    
    # Fetch scan, files, findings, and matches in parallel or joined query
    # Supabase Join: scan -> scan_files, scan -> findings -> rule_matches
    # NOTE: Deep nesting in one query can be tricky. We'll do a few queries for simplicity and safety.

    # 1. Get Scan
    try:
        scan_res = supabase.table('scans').select('*').eq('id', scan_id).eq('user_id', user_id).single().execute()
    except Exception:
        return jsonify({'error': 'Scan not found'}), 404
    if not scan_res.data:
         return jsonify({'error': 'Scan not found'}), 404
    scan = scan_res.data

    try:
        # 2. Get Files
        files_res = supabase.table('scan_files').select('*').eq('scan_id', scan_id).execute()
        files = files_res.data

        # 3. Get Findings & Matches
        # We can fetch findings and join rule_matches
        findings_res = supabase.table('findings').select('*, rule_matches(rule_name, matched_strings)')\
            .eq('scan_id', scan_id).execute()
        findings_data = findings_res.data
        
        # Format Response
        formatted_findings = []
        for f in findings_data:
            f_dict = {
                'id': f['id'],
                'finding_type': f['finding_type'],
                'severity': f['severity'],
                'title': f['title'],
                'description': f['description'],
                'confidence': f['confidence'],
                'details': f['details'],
                'remediation': f['remediation'],
                'detected_at': f['detected_at']
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
        }), 200
    except Exception as e:
        logger.error("Failed to get scan details: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/scans/<scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    """Delete a scan and its files."""
    user_id = get_current_user_id()
    
    # Verify ownership before delete (RLS handles this too, but good to check for file deletion)
    try:
        scan_res = supabase.table('scans').select('id, user_id').eq('id', scan_id).eq('user_id', user_id).single().execute()
    except Exception:
        return jsonify({'error': 'Scan not found'}), 404
    if not scan_res.data:
         return jsonify({'error': 'Scan not found'}), 404

    try:
        # Get file paths to delete from disk
        files_res = supabase.table('scan_files').select('storage_path').eq('scan_id', scan_id).execute()
        for f in files_res.data:
            path = f.get('storage_path')
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

        # Delete from DB (Cascade will handle children: files, findings, matches)
        supabase.table('scans').delete().eq('id', scan_id).execute()

        return jsonify({'message': 'Scan deleted successfully'}), 200
    except Exception as e:
        logger.error("Failed to delete scan: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/scans/<scan_id>/report', methods=['GET'])
@jwt_required()
def get_scan_report(scan_id):
    """Get formatted report data."""
    user_id = get_current_user_id()
    
    try:
        # Re-use logic or query explicitly
        # 1. Get Scan
        scan_res = supabase.table('scans').select('*').eq('id', scan_id).eq('user_id', user_id).single().execute()
        if not scan_res.data:
            return jsonify({'error': 'Scan not found'}), 404
        scan = scan_res.data

        files_res = supabase.table('scan_files').select('*').eq('scan_id', scan_id).limit(1).execute()
        first_file = files_res.data[0] if files_res.data else None

        findings_res = supabase.table('findings').select('*').eq('scan_id', scan_id).execute()
        findings = findings_res.data

        findings_by_severity = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        findings_list = []
        
        for f in findings:
            sev = f.get('severity', 'info')
            findings_by_severity[sev] = findings_by_severity.get(sev, 0) + 1
            findings_list.append({
                'type': f['finding_type'],
                'severity': sev,
                'title': f['title'],
                'description': f['description'],
                'remediation': f['remediation'],
                'confidence': f['confidence'],
            })

        return jsonify({
            'report': {
                'scan_id': scan['id'],
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'file': {
                    'name': first_file['filename'] if first_file else 'Unknown',
                    'hash': first_file['file_hash_sha256'] if first_file else None,
                    'size': first_file['file_size'] if first_file else 0,
                    'type': first_file['mime_type'] if first_file else None,
                },
                'summary': {
                    'status': scan['status'],
                    'threats_found': scan['threats_found'],
                    'duration': scan['duration_seconds'],
                    'findings_by_severity': findings_by_severity,
                },
                'findings': findings_list,
            },
        }), 200
    except Exception as e:
        logger.error("Failed to generate report: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/scans/<scan_id>/export/pdf', methods=['GET'])
@jwt_required()
def export_scan_pdf(scan_id):
    """Export scan as PDF — placeholder returns JSON for now."""
    return success_response({'scan_id': scan_id}, message='PDF export not yet implemented')
