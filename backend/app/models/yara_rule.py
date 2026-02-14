"""YARA Rule Model (Supabase Migration)"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class YaraRule:
    id: str
    name: str
    rule_content: str
    user_id: Optional[str] = None
    category: str = 'custom'
    severity: str = 'medium'
    is_enabled: bool = True
    is_builtin: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
