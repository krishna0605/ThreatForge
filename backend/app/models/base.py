"""Base Pydantic Models for Supabase Interaction"""
from typing import Any, Dict, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class SupabaseModel(BaseModel):
    """Base model for all Supabase entities."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    def to_dict(self, exclude_none: bool = False, exclude: Dict[str, Any] = None) -> Dict[str, Any]:
        """Convert model to dictionary for Supabase insertion/update.
        
        Args:
            exclude_none: If True, exclude fields with None values.
            exclude: specific fields to exclude from the dump
        """
        return self.model_dump(exclude_none=exclude_none, exclude=exclude, mode='json')

class TimeStampedModel(SupabaseModel):
    """Base model with created_at and updated_at timestamps."""
    created_at: Optional[datetime] = Field(default=None)
    # updated_at is generic, some tables might not have it, but useful as a mixin
