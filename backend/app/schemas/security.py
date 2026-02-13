from pydantic import BaseModel, Field
from typing import Optional

class ChangePasswordSchema(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

class DisableMFASchema(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=12)

class UpdatePreferencesSchema(BaseModel):
    session_timeout_enabled: Optional[bool] = None
    session_timeout_minutes: Optional[int] = Field(None, ge=1, le=1440)
    ip_whitelist_enabled: Optional[bool] = None
    audit_logging_enabled: Optional[bool] = None

class AddIPWhitelistSchema(BaseModel):
    cidr_range: str = Field(..., min_length=7) # Min length for x.x.x.x
    label: Optional[str] = Field(None, max_length=100)
