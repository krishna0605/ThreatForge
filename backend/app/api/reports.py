"""Reports Endpoints"""
from flask import jsonify
from flask_jwt_extended import jwt_required

from . import api_bp


@api_bp.route('/reports', methods=['GET'])
@jwt_required()
def list_reports():
    """List all reports."""
    return jsonify({'reports': []}), 200


@api_bp.route('/reports/<report_id>', methods=['GET'])
@jwt_required()
def get_report(report_id):
    """Get report detail."""
    return jsonify({'report_id': report_id}), 200
