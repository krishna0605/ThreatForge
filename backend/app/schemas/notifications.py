from pydantic import BaseModel, Field
from typing import Optional, Any, Dict


class UpdateNotificationPrefsSchema(BaseModel):
    email_threat_alerts: Optional[bool] = None
    email_scan_completions: Optional[bool] = None
    email_weekly_digest: Optional[bool] = None
    push_critical_alerts: Optional[bool] = None
    push_scan_updates: Optional[bool] = None


class PushSubscriptionSchema(BaseModel):
    # Subscription object structure depends on browser but usually contains endpoint and keys
    subscription: Dict[str, Any] = Field(..., description="Push subscription object")


class TestNotificationSchema(BaseModel):
    channel: Optional[str] = Field('all', pattern='^(all|email|push)$')
