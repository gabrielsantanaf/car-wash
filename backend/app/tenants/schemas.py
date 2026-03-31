import uuid
from datetime import datetime

from pydantic import BaseModel


class TenantCreate(BaseModel):
    name: str
    slug: str
    phone_number: str | None = None
    confirmation_timeout_hours: int = 2
    cancellation_min_hours: int = 2
    max_noshows: int = 3


class TenantUpdate(BaseModel):
    name: str | None = None
    phone_number: str | None = None
    logo_url: str | None = None
    confirmation_timeout_hours: int | None = None
    cancellation_min_hours: int | None = None
    max_noshows: int | None = None


class TenantResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    logo_url: str | None
    phone_number: str | None
    confirmation_timeout_hours: int
    cancellation_min_hours: int
    max_noshows: int
    plan: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
