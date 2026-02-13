"""Activity Log Model (Supabase Migration)"""
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

@dataclass
class ActivityLog:
    id: str
    user_id: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    ip_address: Optional[str] = None
    created_at: Optional[str] = None
