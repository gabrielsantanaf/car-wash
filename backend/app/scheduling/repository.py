import uuid
from datetime import datetime

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.scheduling.models import Appointment
from app.vehicles.models import Vehicle
from app.clients.models import Client


class AppointmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, appointment_id: uuid.UUID, tenant_id: uuid.UUID) -> Appointment | None:
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
            .options(selectinload(Appointment.vehicle), selectinload(Appointment.client))
        )
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> Appointment | None:
        result = await self.db.execute(
            select(Appointment).where(Appointment.confirmation_token == token)
        )
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[Appointment]:
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.tenant_id == tenant_id)
            .options(selectinload(Appointment.vehicle), selectinload(Appointment.client))
            .order_by(Appointment.scheduled_at)
        )
        return list(result.scalars().all())

    async def count_in_slot(self, tenant_id: uuid.UUID, slot_start: datetime, slot_end: datetime) -> int:
        result = await self.db.execute(
            select(func.count()).where(
                and_(
                    Appointment.tenant_id == tenant_id,
                    Appointment.scheduled_at >= slot_start,
                    Appointment.scheduled_at < slot_end,
                    Appointment.status.in_(["pending", "scheduled", "in_queue", "in_progress"]),
                )
            )
        )
        return result.scalar_one()

    async def create(self, data: dict) -> Appointment:
        appointment = Appointment(**data)
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def update(self, appointment: Appointment, data: dict) -> Appointment:
        for key, value in data.items():
            setattr(appointment, key, value)
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment
