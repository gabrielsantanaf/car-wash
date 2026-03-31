import uuid
from pydantic import BaseModel


class CapacitySlotCreate(BaseModel):
    weekday: int  # 0-6
    start_time: str  # "HH:MM"
    end_time: str
    max_cars: int = 1


class CapacitySlotUpdate(BaseModel):
    max_cars: int | None = None
    start_time: str | None = None
    end_time: str | None = None


class CapacitySlotResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    weekday: int
    start_time: str
    end_time: str
    max_cars: int

    model_config = {"from_attributes": True}
