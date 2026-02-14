"""Scan Models (Pydantic Migration)"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import Field, field_validator
from .base import SupabaseModel


class ScanFileModel(SupabaseModel):
    id: Optional[UUID] = None
    scan_id: UUID
    filename: str
    file_hash_sha256: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    entropy: Optional[float] = None
    storage_path: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class ScanModel(SupabaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    status: str = Field(default='queued')
    scan_type: str = Field(default='full')
    total_files: int = Field(default=0)
    threats_found: int = Field(default=0)
    duration_seconds: Optional[float] = None
    options: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Relationships (optional, for response serialization)
    files: Optional[List[ScanFileModel]] = None

    @field_validator('status')
    def validate_status(cls, v):
        allowed = {'queued', 'running', 'completed', 'failed'}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v
