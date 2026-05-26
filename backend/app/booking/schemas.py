import uuid
from datetime import datetime
from pydantic import BaseModel


class AvailableSlot(BaseModel):
    slot_id: uuid.UUID
    date: str          # "YYYY-MM-DD"
    weekday: int
    start_time: str    # "HH:MM" — exact time the car should arrive
    end_time: str      # "HH:MM" — expected completion time
    available: int     # remaining slot weight
    max_cars: int


class BookingRequest(BaseModel):
    name: str
    phone: str
    plate: str
    brand: str | None = None
    model: str | None = None
    color: str | None = None
    size_category: str = "small"  # "small" or "large" — used for internal slot management
    service_type: str
    scheduled_at: datetime


class BookingResponse(BaseModel):
    appointment_id: uuid.UUID
    status: str
    message: str
