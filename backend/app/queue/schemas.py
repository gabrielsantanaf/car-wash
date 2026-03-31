import uuid
from datetime import datetime
from pydantic import BaseModel


class VehicleInfo(BaseModel):
    plate: str
    brand: str | None
    model: str | None
    color: str | None

    model_config = {"from_attributes": True}


class ClientInfo(BaseModel):
    name: str
    phone: str

    model_config = {"from_attributes": True}


class AppointmentInfo(BaseModel):
    service_type: str
    scheduled_at: datetime
    vehicle: VehicleInfo | None = None
    client: ClientInfo | None = None

    model_config = {"from_attributes": True}


class QueueEntryResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    appointment_id: uuid.UUID
    position: int
    status: str
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    appointment: AppointmentInfo | None = None

    model_config = {"from_attributes": True}


class QueueStatusUpdate(BaseModel):
    status: str  # waiting | washing | drying | done
