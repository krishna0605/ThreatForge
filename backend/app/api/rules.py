"""YARA Rule Endpoints — Supabase Implementation"""
from datetime import datetime, timezone
import uuid
import os
import glob
from flask import request, jsonify
from flask_jwt_extended import jwt_required
import logging

from . import api_bp
from ..supabase_client import supabase

from ..services.yara_engine import YaraEngine
from ..utils.auth import get_current_user_id
from ..utils.validation import validate_json
from ..schemas.rules import CreateRuleSchema, UpdateRuleSchema, ValidateRuleSchema

logger = logging.getLogger('threatforge.rules')

yara_engine = YaraEngine()

# Category mapping from directory names
CATEGORY_MAP = {
    'malware': 'malware',
    'network': 'network',
    'suspicious': 'custom',
    'packer': 'malware',
}


@api_bp.route('/rules', methods=['GET'])
@jwt_required()
def list_rules():
    """List all YARA rules (user's own + builtin)."""
    user_id = get_current_user_id()
    category = request.args.get('category')

    # Supabase query: user_id = me OR is_builtin = true
    # Syntax: .or_(f"user_id.eq.{user_id},is_builtin.eq.true")
    query = supabase.table('yara_rules').select('*')\
        .or_(f"user_id.eq.{user_id},is_builtin.eq.true")

    if category:
        query = query.eq('category', category)

    result = query.order('created_at', desc=True).execute()
    rules = result.data

    return jsonify({
        'rules': [{
            'id': r['id'],
            'name': r['name'],
            'category': r['category'],
            'severity': r['severity'],
            'rule_content': r['rule_content'],
            'is_enabled': r['is_enabled'],
            'is_builtin': r['is_builtin'],
            'created_at': r['created_at'],
            'updated_at': r['updated_at'],
        } for r in rules],
        'total': len(rules),
    }), 200


@api_bp.route('/rules', methods=['POST'])
@jwt_required()
@validate_json(CreateRuleSchema)
def create_rule():
    """Create a new YARA rule."""
    user_id = get_current_user_id()
    data = request.validated_data

    name = data.name.strip()
    rule_content = data.rule_content.strip()
    category = data.category
    severity = data.severity

    # Validate syntax
    validation = yara_engine.validate_rule(rule_content)
    if not validation['valid']:
        return jsonify({'error': 'Invalid YARA syntax', 'details': validation['errors']}), 400

    rule_id = str(uuid.uuid4())
    new_rule = {
        'id': rule_id,
        'user_id': user_id,
        'name': name,
        'category': category,
        'severity': severity,
        'rule_content': rule_content,
        'is_enabled': True,
        'is_builtin': False,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

    try:
        supabase.table('yara_rules').insert(new_rule).execute()

        supabase.table('activity_logs').insert({
            'user_id': user_id,
            'action': 'rule_created',
            'resource_type': 'yara_rule',
            'metadata': {'rule_name': name},
            'ip_address': request.remote_addr
        }).execute()

        return jsonify({
            'message': 'Rule created successfully',
            'rule': {
                'id': rule_id,
                'name': name,
                'category': category,
                'severity': severity,
            },
        }), 201
    except Exception as e:
        logger.error("Failed to create rule: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/rules/<rule_id>', methods=['PUT'])
@jwt_required()
@validate_json(UpdateRuleSchema)
def update_rule(rule_id):
    """Update a YARA rule."""
    user_id = get_current_user_id()

    # Check ownership
    try:
        rule_res = supabase.table('yara_rules').select('*').eq('id', rule_id).single().execute()
    except Exception:
        return jsonify({'error': 'Rule not found'}), 404
    if not rule_res.data:
        return jsonify({'error': 'Rule not found'}), 404

    rule = rule_res.data
    # Check if built-in
    if rule.get('is_builtin'):
        return jsonify({'error': 'Cannot edit builtin rules'}), 403
    # Check if owned by user
    if rule.get('user_id') != user_id:
        return jsonify({'error': 'Rule not owned by you'}), 403

    data = request.validated_data

    updates = {'updated_at': datetime.now(timezone.utc).isoformat()}

    if data.name:
        updates['name'] = data.name.strip()
    if data.category:
        updates['category'] = data.category
    if data.severity:
        updates['severity'] = data.severity
    if data.rule_content:
        validation = yara_engine.validate_rule(data.rule_content)
        if not validation['valid']:
            return jsonify({'error': 'Invalid YARA syntax', 'details': validation['errors']}), 400
        updates['rule_content'] = data.rule_content
    if data.is_enabled is not None:
        updates['is_enabled'] = data.is_enabled

    try:
        supabase.table('yara_rules').update(updates).eq('id', rule_id).execute()
        return jsonify({'message': 'Rule updated successfully'}), 200
    except Exception as e:
        logger.error("Failed to update rule: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/rules/<rule_id>', methods=['DELETE'])
@jwt_required()
def delete_rule(rule_id):
    """Delete a YARA rule."""
    user_id = get_current_user_id()

    # Check ownership
    try:
        rule_res = supabase.table('yara_rules').select('*').eq('id', rule_id).single().execute()
    except Exception:
        return jsonify({'error': 'Rule not found'}), 404
    if not rule_res.data:
        return jsonify({'error': 'Rule not found'}), 404

    rule = rule_res.data
    if rule.get('is_builtin'):
        return jsonify({'error': 'Cannot delete builtin rules'}), 403
    if rule.get('user_id') != user_id:
        return jsonify({'error': 'Rule not owned by you'}), 403

    try:
        supabase.table('yara_rules').delete().eq('id', rule_id).execute()
        return jsonify({'message': 'Rule deleted successfully'}), 200
    except Exception as e:
        logger.error("Failed to delete rule: %s", e)
        return jsonify({'error': 'Internal server error'}), 500


@api_bp.route('/rules/<rule_id>/test', methods=['POST'])
@jwt_required()
def test_rule(rule_id):
    """Test a rule against uploaded file content."""
    # Get rule content regardless of ownership (can test builtin rules)
    try:
        rule_res = supabase.table('yara_rules').select('name, rule_content').eq('id', rule_id).single().execute()
    except Exception:
        return jsonify({'error': 'Rule not found'}), 404
    if not rule_res.data:
        return jsonify({'error': 'Rule not found'}), 404
    rule = rule_res.data

    if 'file' not in request.files:
        return jsonify({'error': 'No test file provided'}), 400

    file = request.files['file']
    import tempfile
    import os
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='_test')
    file.save(tmp.name)
    tmp.close()

    try:
        matches = yara_engine.test_rule(rule['rule_content'], tmp.name)
        return jsonify({'matches': matches, 'rule_name': rule['name']}), 200
    except Exception as e:
        logger.error("Failed to test rule: %s", e)
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        os.unlink(tmp.name)


@api_bp.route('/rules/validate', methods=['POST'])
@jwt_required()
@validate_json(ValidateRuleSchema)
def validate_rule():
    """Validate YARA syntax without saving."""
    data = request.validated_data
    rule_content = data.rule_content

    result = yara_engine.validate_rule(rule_content)
    return jsonify(result), 200


@api_bp.route('/rules/seed', methods=['POST'])
@jwt_required()
def seed_rules():
    """Seed built-in YARA rules from the yara_rules/ directory."""
    import re

    rules_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'yara_rules')
    if not os.path.exists(rules_dir):
        return jsonify({'error': 'yara_rules directory not found'}), 404

    seeded = 0
    skipped = 0
    errors = []

    # Get existing built-in rule names to avoid duplicates
    existing_res = supabase.table('yara_rules').select('name').eq('is_builtin', True).execute()
    existing_names = {r['name'] for r in (existing_res.data or [])}

    for yar_file in glob.glob(os.path.join(rules_dir, '**', '*.yar'), recursive=True):
        # Determine category from parent directory name
        parent_dir = os.path.basename(os.path.dirname(yar_file))
        category = CATEGORY_MAP.get(parent_dir, 'custom')

        with open(yar_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract individual rules from the file
        rule_blocks = re.split(r'\n(?=rule\s+\w+)', content)
        for block in rule_blocks:
            block = block.strip()
            if not block.startswith('rule '):
                continue

            # Extract rule name
            match = re.match(r'rule\s+(\w+)', block)
            if not match:
                continue
            rule_name = match.group(1)

            if rule_name in existing_names:
                skipped += 1
                continue

            # Extract severity from meta section
            severity = 'medium'
            sev_match = re.search(r'severity\s*=\s*"(\w+)"', block)
            if sev_match:
                severity = sev_match.group(1)

            try:
                supabase.table('yara_rules').insert({
                    'id': str(uuid.uuid4()),
                    'name': rule_name,
                    'category': category,
                    'severity': severity,
                    'rule_content': block,
                    'is_enabled': True,
                    'is_builtin': True,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                }).execute()
                seeded += 1
                existing_names.add(rule_name)
            except Exception as e:
                errors.append(f'{rule_name}: {str(e)}')
                logger.error("Failed to seed rule %s: %s", rule_name, e)

    return jsonify({
        'message': f'Seeded {seeded} rules, skipped {skipped} existing',
        'seeded': seeded,
        'skipped': skipped,
        'errors': errors[:10],
    }), 200
