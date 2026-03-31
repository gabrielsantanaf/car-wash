import uuid
from datetime import datetime
from pydantic import BaseModel


class AvailableSlot(BaseModel):
    slot_id: uuid.UUID
    date: str          # "YYYY-MM-DD"
    weekday: int
    start_time: str    # "HH:MM"
    end_time: str
    available: int
    max_cars: int


class BookingRequest(BaseModel):
    name: str
    phone: str
    plate: str
    brand: str | None = None
    model: str | None = None
    color: str | None = None
    service_type: str
    scheduled_at: datetime


class BookingResponse(BaseModel):
    appointment_id: uuid.UUID
    status: str
    message: str
