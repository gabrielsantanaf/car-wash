import uuid
from datetime import datetime
from pydantic import BaseModel


class VehicleCreate(BaseModel):
    client_id: uuid.UUID
    plate: str
    brand: str | None = None
    model: str | None = None
    color: str | None = None


class VehicleResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    tenant_id: uuid.UUID
    plate: str
    brand: str | None
    model: str | None
    color: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
