import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.scheduling.repository import AppointmentRepository
from app.scheduling.schemas import AppointmentCreate, AppointmentStatusUpdate


VALID_TRANSITIONS = {
    "pending": ["scheduled", "cancelled"],
    "scheduled": ["in_queue", "cancelled"],
    "in_queue": ["in_progress", "cancelled"],
    "in_progress": ["done"],
    "done": [],
    "cancelled": [],
}


class SchedulingService:
    def __init__(self, db: AsyncSession):
        self.repo = AppointmentRepository(db)

    async def list_appointments(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def create_appointment(self, tenant_id: uuid.UUID, data: AppointmentCreate):
        return await self.repo.create({
            **data.model_dump(),
            "tenant_id": tenant_id,
            "source": "internal",
            "status": "scheduled",
        })

    async def update_status(self, tenant_id: uuid.UUID, appointment_id: uuid.UUID, data: AppointmentStatusUpdate):
        appointment = await self.repo.get_by_id(appointment_id, tenant_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
        allowed = VALID_TRANSITIONS.get(appointment.status, [])
        if data.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cannot transition from {appointment.status} to {data.status}",
            )
        return await self.repo.update(appointment, {"status": data.status})
