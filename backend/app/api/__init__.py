"""API Blueprint Registration"""
from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import auth, scans, rules, dashboard, reports, threats, api_keys  # noqa: E402, F401
