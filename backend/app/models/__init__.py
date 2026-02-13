"""Database Models Package (Supabase Migration)
Models are now simple dataclasses for type hinting, not ORM models.
"""
from .user import UserModel
from .scan import ScanModel, ScanFileModel
from .finding import FindingModel, RuleMatchModel
from .yara_rule import YaraRule
from .api_key import ApiKey
from .activity_log import ActivityLog

__all__ = [
    'UserModel', 'ScanModel', 'ScanFileModel', 'FindingModel', 'RuleMatchModel',
    'YaraRule', 'ApiKey', 'ActivityLog',
]
