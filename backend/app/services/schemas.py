import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class ServiceResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    description: str | None
    price: Decimal | None
    is_active: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}
