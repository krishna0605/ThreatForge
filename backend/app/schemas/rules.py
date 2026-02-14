from pydantic import BaseModel, Field
from typing import Optional, Literal


class CreateRuleSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    rule_content: str = Field(..., min_length=1)
    category: str = Field('custom', min_length=1)
    severity: Literal['critical', 'high', 'medium', 'low'] = 'medium'


class UpdateRuleSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    rule_content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1)
    severity: Optional[Literal['critical', 'high', 'medium', 'low']] = None
    is_enabled: Optional[bool] = None


class ValidateRuleSchema(BaseModel):
    rule_content: str = Field(..., min_length=1)
