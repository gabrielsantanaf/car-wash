import uuid
from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    client_id: uuid.UUID
    appointment_id: uuid.UUID | None
    type: str
    message: str
    sent_at: datetime | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
