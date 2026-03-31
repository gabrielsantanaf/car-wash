import uuid
from datetime import datetime
from pydantic import BaseModel


class AppointmentCreate(BaseModel):
    vehicle_id: uuid.UUID
    client_id: uuid.UUID
    scheduled_at: datetime
    service_type: str
    price: float | None = None
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: str


class VehicleInfo(BaseModel):
    id: uuid.UUID
    plate: str
    brand: str | None
    model: str | None
    color: str | None

    model_config = {"from_attributes": True}


class ClientInfo(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    is_blocked: bool

    model_config = {"from_attributes": True}


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    vehicle_id: uuid.UUID
    client_id: uuid.UUID
    scheduled_at: datetime
    service_type: str
    price: float | None
    notes: str | None
    source: str
    status: str
    created_at: datetime
    vehicle: VehicleInfo | None = None
    client: ClientInfo | None = None

    model_config = {"from_attributes": True}
