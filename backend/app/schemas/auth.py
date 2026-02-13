from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1) # Don't enforce length here to avoid leaking info, but ensure presence
    totp_code: Optional[str] = None

class SignupSchema(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = Field(None, min_length=2, max_length=50)

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class MFASchema(BaseModel):
    totp_code: str = Field(..., min_length=6, max_length=12) # Covers recovery codes too

class GoogleAuthSchema(BaseModel):
    access_token: str = Field(..., min_length=10)
