"""User Models (Pydantic Migration)"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import Field, EmailStr
from .base import SupabaseModel

class UserModel(SupabaseModel):
    id: UUID
    email: EmailStr
    display_name: str
    password_hash: Optional[str] = None # Optional when reading public profiles
    role: str = Field(default='analyst')
    avatar_url: Optional[str] = None
    mfa_enabled: bool = Field(default=False)
    mfa_secret: Optional[str] = None
    created_at: Optional[datetime] = None

    # Helper for legacy compatibility if needed
    @classmethod
    def from_dict(cls, data: dict):
        return cls.model_validate(data)
