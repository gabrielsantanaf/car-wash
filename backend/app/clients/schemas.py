import uuid
from datetime import datetime
from pydantic import BaseModel


class ClientResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    phone: str
    noshow_count: int
    is_blocked: bool
    created_at: datetime

    model_config = {"from_attributes": True}
