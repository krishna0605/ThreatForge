## Step 2: Backend API Endpoints

### 2.1 Scans API — `backend/app/api/scans.py`

**OVERWRITE** the entire file. This replaces all 6 TODO stubs with real implementations.

```python
"""Scan Endpoints — Full Implementation"""
import os
import uuid
from datetime import datetime, timezone
from flask import request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from . import api_bp
from ..extensions import db
from ..models.scan import Scan, ScanFile
from ..models.finding import Finding, RuleMatch
from ..models.yara_rule import YaraRule
from ..models.activity_log import ActivityLog
from ..services.scanner import ScanOrchestrator


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
    user_id = get_jwt_identity()

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

    # Save file
    upload_folder = current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads')
    os.makedirs(upload_folder, exist_ok=True)
    scan_id = str(uuid.uuid4())
    safe_name = secure_filename(file.filename)
    file_path = os.path.join(upload_folder, f'{scan_id}_{safe_name}')
    file.save(file_path)

    # Create DB records
    scan = Scan(
        id=scan_id,
        user_id=user_id,
        status='running',
        scan_type=scan_type,
        total_files=1,
        options={'enable_ml': enable_ml, 'enable_yara': enable_yara},
    )
    db.session.add(scan)

    scan_file = ScanFile(
        scan_id=scan_id,
        filename=safe_name,
        file_size=os.path.getsize(file_path),
        storage_path=file_path,
    )
    db.session.add(scan_file)
    db.session.commit()

    # Run scan synchronously (for Phase 3; Phase 4 will add Celery async)
    try:
        orchestrator = ScanOrchestrator()

        # Get enabled YARA rules
        yara_rules = []
        if enable_yara:
            db_rules = YaraRule.query.filter_by(is_enabled=True).all()
            yara_rules = [{'name': r.name, 'content': r.rule_content} for r in db_rules]

        ml_url = current_app.config.get('ML_SERVICE_URL')
        results = orchestrator.run_scan(
            file_path=file_path,
            options={'enable_ml': enable_ml},
            yara_rules=yara_rules,
            ml_service_url=ml_url,
        )

        # Update scan file with metadata
        scan_file.file_hash_sha256 = results['metadata'].get('sha256')
        scan_file.mime_type = results['metadata'].get('mime_type')
        scan_file.entropy = results.get('entropy')

        # Create Finding records
        threats = 0
        for f_data in results.get('findings', []):
            finding = Finding(
                scan_id=scan_id,
                scan_file_id=scan_file.id,
                finding_type=f_data['finding_type'],
                severity=f_data['severity'],
                title=f_data['title'],
                description=f_data.get('description'),
                confidence=f_data.get('confidence'),
                details=f_data.get('details', {}),
                remediation=f_data.get('remediation'),
            )
            db.session.add(finding)
            if f_data['severity'] in ('critical', 'high', 'medium'):
                threats += 1

            # Create RuleMatch records for YARA findings
            if f_data['finding_type'] == 'yara' and 'match' in f_data.get('details', {}):
                match_data = f_data['details']['match']
                db.session.flush()  # need finding.id
                rule_match = RuleMatch(
                    finding_id=finding.id,
                    rule_name=match_data.get('rule_name', 'unknown'),
                    matched_strings=match_data.get('matched_strings', []),
                )
                db.session.add(rule_match)

        # Update scan status
        scan.status = 'completed'
        scan.threats_found = threats
        scan.duration_seconds = results.get('duration_seconds', 0)
        scan.completed_at = datetime.now(timezone.utc)

        # Activity log
        log = ActivityLog(user_id=user_id, action='scan_created',
                          resource_type='scan', resource_id=scan_id,
                          metadata={'filename': safe_name, 'threats': threats},
                          ip_address=request.remote_addr)
        db.session.add(log)
        db.session.commit()

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
        scan.status = 'failed'
        db.session.commit()
        return jsonify({'error': f'Scan failed: {str(e)}', 'scan_id': scan_id}), 500


@api_bp.route('/scans', methods=['GET'])
@jwt_required()
def list_scans():
    """List user's scans with pagination and filters."""
    user_id = get_jwt_identity()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    sort_by = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')

    per_page = min(per_page, 50)  # cap

    query = Scan.query.filter_by(user_id=user_id)

    if status_filter:
        query = query.filter_by(status=status_filter)

    if order == 'desc':
        query = query.order_by(Scan.created_at.desc())
    else:
        query = query.order_by(Scan.created_at.asc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    scans_data = []
    for scan in pagination.items:
        first_file = scan.files.first()
        scans_data.append({
            'id': scan.id,
            'status': scan.status,
            'scan_type': scan.scan_type,
            'total_files': scan.total_files,
            'threats_found': scan.threats_found,
            'duration_seconds': scan.duration_seconds,
            'filename': first_file.filename if first_file else None,
            'created_at': scan.created_at.isoformat() if scan.created_at else None,
            'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
        })

    return jsonify({
        'scans': scans_data,
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
        },
    }), 200


@api_bp.route('/scans/<scan_id>', methods=['GET'])
@jwt_required()
def get_scan(scan_id):
    """Get full scan details with findings."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    files = []
    for sf in scan.files.all():
        files.append({
            'id': sf.id,
            'filename': sf.filename,
            'file_hash_sha256': sf.file_hash_sha256,
            'mime_type': sf.mime_type,
            'file_size': sf.file_size,
            'entropy': sf.entropy,
        })

    findings = []
    for f in scan.findings.all():
        finding_data = {
            'id': f.id,
            'finding_type': f.finding_type,
            'severity': f.severity,
            'title': f.title,
            'description': f.description,
            'confidence': f.confidence,
            'details': f.details,
            'remediation': f.remediation,
            'detected_at': f.detected_at.isoformat() if f.detected_at else None,
        }
        # Include rule matches
        matches = [{'rule_name': rm.rule_name, 'matched_strings': rm.matched_strings}
                   for rm in f.rule_matches.all()]
        if matches:
            finding_data['rule_matches'] = matches
        findings.append(finding_data)

    return jsonify({
        'id': scan.id,
        'status': scan.status,
        'scan_type': scan.scan_type,
        'total_files': scan.total_files,
        'threats_found': scan.threats_found,
        'duration_seconds': scan.duration_seconds,
        'options': scan.options,
        'created_at': scan.created_at.isoformat() if scan.created_at else None,
        'completed_at': scan.completed_at.isoformat() if scan.completed_at else None,
        'files': files,
        'findings': findings,
    }), 200


@api_bp.route('/scans/<scan_id>', methods=['DELETE'])
@jwt_required()
def delete_scan(scan_id):
    """Delete a scan and its files."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    # Delete uploaded files from disk
    for sf in scan.files.all():
        if sf.storage_path and os.path.exists(sf.storage_path):
            try:
                os.remove(sf.storage_path)
            except OSError:
                pass

    db.session.delete(scan)
    db.session.commit()

    return jsonify({'message': 'Scan deleted successfully'}), 200


@api_bp.route('/scans/<scan_id>/report', methods=['GET'])
@jwt_required()
def get_scan_report(scan_id):
    """Get formatted report data for display or PDF generation."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    first_file = scan.files.first()
    findings_by_severity = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
    findings_list = []
    for f in scan.findings.all():
        findings_by_severity[f.severity] = findings_by_severity.get(f.severity, 0) + 1
        findings_list.append({
            'type': f.finding_type,
            'severity': f.severity,
            'title': f.title,
            'description': f.description,
            'remediation': f.remediation,
            'confidence': f.confidence,
        })

    return jsonify({
        'report': {
            'scan_id': scan.id,
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'file': {
                'name': first_file.filename if first_file else 'Unknown',
                'hash': first_file.file_hash_sha256 if first_file else None,
                'size': first_file.file_size if first_file else 0,
                'type': first_file.mime_type if first_file else None,
            },
            'summary': {
                'status': scan.status,
                'threats_found': scan.threats_found,
                'duration': scan.duration_seconds,
                'findings_by_severity': findings_by_severity,
            },
            'findings': findings_list,
        },
    }), 200


@api_bp.route('/scans/<scan_id>/export/pdf', methods=['GET'])
@jwt_required()
def export_scan_pdf(scan_id):
    """Export scan as PDF — placeholder returns JSON for now."""
    user_id = get_jwt_identity()
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify({'error': 'Scan not found'}), 404
    return jsonify({'message': 'PDF export will be available in Phase 4', 'scan_id': scan_id}), 200
```

---

### 2.2 YARA Rules API — `backend/app/api/rules.py`

**OVERWRITE** the entire file.

```python
"""YARA Rule Endpoints — Full Implementation"""
from datetime import datetime, timezone
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from . import api_bp
from ..extensions import db
from ..models.yara_rule import YaraRule
from ..models.activity_log import ActivityLog
from ..services.yara_engine import YaraEngine

yara_engine = YaraEngine()


@api_bp.route('/rules', methods=['GET'])
@jwt_required()
def list_rules():
    """List all YARA rules (user's own + builtin)."""
    user_id = get_jwt_identity()
    category = request.args.get('category')

    query = YaraRule.query.filter(
        db.or_(YaraRule.user_id == user_id, YaraRule.is_builtin == True)
    )
    if category:
        query = query.filter_by(category=category)

    rules = query.order_by(YaraRule.created_at.desc()).all()

    return jsonify({
        'rules': [{
            'id': r.id,
            'name': r.name,
            'category': r.category,
            'severity': r.severity,
            'rule_content': r.rule_content,
            'is_enabled': r.is_enabled,
            'is_builtin': r.is_builtin,
            'created_at': r.created_at.isoformat() if r.created_at else None,
            'updated_at': r.updated_at.isoformat() if r.updated_at else None,
        } for r in rules],
        'total': len(rules),
    }), 200


@api_bp.route('/rules', methods=['POST'])
@jwt_required()
def create_rule():
    """Create a new YARA rule."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    name = data.get('name', '').strip()
    rule_content = data.get('rule_content', '').strip()
    category = data.get('category', 'custom')
    severity = data.get('severity', 'medium')

    if not name:
        return jsonify({'error': 'Rule name is required'}), 400
    if not rule_content:
        return jsonify({'error': 'Rule content is required'}), 400
    if severity not in ('critical', 'high', 'medium', 'low'):
        return jsonify({'error': 'Severity must be critical, high, medium, or low'}), 400

    # Validate syntax
    validation = yara_engine.validate_rule(rule_content)
    if not validation['valid']:
        return jsonify({'error': 'Invalid YARA syntax', 'details': validation['errors']}), 400

    rule = YaraRule(
        user_id=user_id,
        name=name,
        category=category,
        severity=severity,
        rule_content=rule_content,
        is_enabled=True,
        is_builtin=False,
    )
    db.session.add(rule)

    log = ActivityLog(user_id=user_id, action='rule_created',
                      resource_type='yara_rule', metadata={'rule_name': name},
                      ip_address=request.remote_addr)
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Rule created successfully',
        'rule': {
            'id': rule.id,
            'name': rule.name,
            'category': rule.category,
            'severity': rule.severity,
        },
    }), 201


@api_bp.route('/rules/<rule_id>', methods=['PUT'])
@jwt_required()
def update_rule(rule_id):
    """Update a YARA rule."""
    user_id = get_jwt_identity()
    rule = YaraRule.query.filter_by(id=rule_id, user_id=user_id).first()

    if not rule:
        return jsonify({'error': 'Rule not found or not owned by you'}), 404
    if rule.is_builtin:
        return jsonify({'error': 'Cannot edit builtin rules'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    if 'name' in data:
        rule.name = data['name'].strip()
    if 'category' in data:
        rule.category = data['category']
    if 'severity' in data:
        if data['severity'] not in ('critical', 'high', 'medium', 'low'):
            return jsonify({'error': 'Invalid severity'}), 400
        rule.severity = data['severity']
    if 'rule_content' in data:
        validation = yara_engine.validate_rule(data['rule_content'])
        if not validation['valid']:
            return jsonify({'error': 'Invalid YARA syntax', 'details': validation['errors']}), 400
        rule.rule_content = data['rule_content']
    if 'is_enabled' in data:
        rule.is_enabled = bool(data['is_enabled'])

    db.session.commit()
    return jsonify({'message': 'Rule updated successfully'}), 200


@api_bp.route('/rules/<rule_id>', methods=['DELETE'])
@jwt_required()
def delete_rule(rule_id):
    """Delete a YARA rule."""
    user_id = get_jwt_identity()
    rule = YaraRule.query.filter_by(id=rule_id, user_id=user_id).first()

    if not rule:
        return jsonify({'error': 'Rule not found or not owned by you'}), 404
    if rule.is_builtin:
        return jsonify({'error': 'Cannot delete builtin rules'}), 403

    db.session.delete(rule)
    db.session.commit()
    return jsonify({'message': 'Rule deleted successfully'}), 200


@api_bp.route('/rules/<rule_id>/test', methods=['POST'])
@jwt_required()
def test_rule(rule_id):
    """Test a rule against uploaded file content."""
    rule = YaraRule.query.get(rule_id)
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No test file provided'}), 400

    file = request.files['file']
    import tempfile, os
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='_test')
    file.save(tmp.name)
    tmp.close()

    try:
        matches = yara_engine.test_rule(rule.rule_content, tmp.name)
        return jsonify({'matches': matches, 'rule_name': rule.name}), 200
    finally:
        os.unlink(tmp.name)


@api_bp.route('/rules/validate', methods=['POST'])
@jwt_required()
def validate_rule():
    """Validate YARA syntax without saving."""
    data = request.get_json()
    rule_content = data.get('rule_content', '') if data else ''

    if not rule_content:
        return jsonify({'error': 'rule_content is required'}), 400

    result = yara_engine.validate_rule(rule_content)
    return jsonify(result), 200
```

---
