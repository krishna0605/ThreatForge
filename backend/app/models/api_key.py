"""API Key Model (Supabase Migration)"""
from dataclasses import dataclass
from typing import Optional

@dataclass
class ApiKey:
    id: str
    user_id: str
    key_hash: str
    key_prefix: str
    label: Optional[str] = None
    last_used_at: Optional[str] = None
    expires_at: Optional[str] = None
    created_at: Optional[str] = None
