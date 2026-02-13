"""Finding Models (Pydantic Migration)"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import Field, field_validator
from .base import SupabaseModel

class RuleMatchModel(SupabaseModel):
    id: Optional[UUID] = None
    finding_id: UUID
    rule_name: str
    rule_id: Optional[UUID] = None
    matched_strings: List[Any] = Field(default_factory=list)

class FindingModel(SupabaseModel):
    id: Optional[UUID] = None
    scan_id: UUID
    scan_file_id: Optional[UUID] = None
    finding_type: str
    severity: str
    title: str
    description: Optional[str] = None
    confidence: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    remediation: Optional[str] = None
    detected_at: Optional[datetime] = None
    
    # Relationships
    rule_matches: Optional[List[RuleMatchModel]] = None

    @field_validator('finding_type')
    def validate_type(cls, v):
        allowed = {'malware', 'steganography', 'network', 'yara', 'entropy', 'pe_header', 'strings'}
        if v not in allowed:
            raise ValueError(f"Finding type must be one of {allowed}")
        return v

    @field_validator('severity')
    def validate_severity(cls, v):
        allowed = {'critical', 'high', 'medium', 'low', 'info'}
        if v not in allowed:
            raise ValueError(f"Severity must be one of {allowed}")
        return v
