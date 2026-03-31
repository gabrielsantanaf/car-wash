import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.queue.models import QueueEntry
from app.scheduling.models import Appointment
from app.vehicles.models import Vehicle
from app.clients.models import Client


class QueueRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[QueueEntry]:
        result = await self.db.execute(
            select(QueueEntry)
            .where(QueueEntry.tenant_id == tenant_id, QueueEntry.status != "done")
            .options(
                selectinload(QueueEntry.appointment).selectinload(Appointment.vehicle),
                selectinload(QueueEntry.appointment).selectinload(Appointment.client),
            )
            .order_by(QueueEntry.position)
        )
        return list(result.scalars().all())

    async def get_by_id(self, entry_id: uuid.UUID, tenant_id: uuid.UUID) -> QueueEntry | None:
        result = await self.db.execute(
            select(QueueEntry).where(QueueEntry.id == entry_id, QueueEntry.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_appointment(self, appointment_id: uuid.UUID) -> QueueEntry | None:
        result = await self.db.execute(
            select(QueueEntry).where(QueueEntry.appointment_id == appointment_id)
        )
        return result.scalar_one_or_none()

    async def next_position(self, tenant_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(QueueEntry.position), 0))
            .where(QueueEntry.tenant_id == tenant_id)
        )
        return result.scalar_one() + 1

    async def create(self, data: dict) -> QueueEntry:
        entry = QueueEntry(**data)
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def update(self, entry: QueueEntry, data: dict) -> QueueEntry:
        for key, value in data.items():
            setattr(entry, key, value)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry
