import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.notifications.service import NotificationService
from app.queue.repository import QueueRepository
from app.queue.schemas import QueueStatusUpdate
from app.scheduling.repository import AppointmentRepository
from app.clients.repository import ClientRepository
from app.tenants.repository import TenantRepository


VALID_QUEUE_TRANSITIONS = {
    "waiting": ["washing"],
    "washing": ["drying"],
    "drying": ["done"],
    "done": [],
}

APPOINTMENT_STATUS_MAP = {
    "washing": "in_progress",
}


class QueueService:
    def __init__(self, db: AsyncSession):
        self.repo = QueueRepository(db)
        self.appointments = AppointmentRepository(db)
        self.clients = ClientRepository(db)
        self.tenants = TenantRepository(db)
        self.notifications = NotificationService(db)

    async def list_queue(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def add_to_queue(self, tenant_id: uuid.UUID, appointment_id: uuid.UUID):
        appointment = await self.appointments.get_by_id(appointment_id, tenant_id)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
        if appointment.status not in ("scheduled",):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Appointment must be scheduled")
        existing = await self.repo.get_by_appointment(appointment_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already in queue")

        position = await self.repo.next_position(tenant_id)
        entry = await self.repo.create({
            "tenant_id": tenant_id,
            "appointment_id": appointment_id,
            "position": position,
            "status": "waiting",
        })
        await self.appointments.update(appointment, {"status": "in_queue"})
        return entry

    async def update_status(self, tenant_id: uuid.UUID, entry_id: uuid.UUID, data: QueueStatusUpdate):
        entry = await self.repo.get_by_id(entry_id, tenant_id)
        if not entry:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue entry not found")

        allowed = VALID_QUEUE_TRANSITIONS.get(entry.status, [])
        if data.status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Cannot transition from {entry.status} to {data.status}",
            )

        updates: dict = {"status": data.status}
        if data.status == "washing":
            updates["started_at"] = datetime.now(timezone.utc)
        if data.status == "done":
            updates["finished_at"] = datetime.now(timezone.utc)

        entry = await self.repo.update(entry, updates)

        # Sync appointment status
        appointment = await self.appointments.get_by_id(entry.appointment_id, tenant_id)
        if appointment:
            if data.status == "washing":
                await self.appointments.update(appointment, {"status": "in_progress"})
            elif data.status == "done":
                await self.appointments.update(appointment, {"status": "done"})
                # Send completion notification
                tenant = await self.tenants.get_by_id(tenant_id)
                client = await self.clients.get_by_id(appointment.client_id, tenant_id)
                if tenant and client:
                    await self.notifications.send_completion(tenant, client, appointment)

        return entry
