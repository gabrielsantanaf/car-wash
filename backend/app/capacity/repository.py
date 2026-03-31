import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.capacity.models import CapacitySlot


class CapacityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[CapacitySlot]:
        result = await self.db.execute(select(CapacitySlot).where(CapacitySlot.tenant_id == tenant_id))
        return list(result.scalars().all())

    async def get_by_id(self, slot_id: uuid.UUID, tenant_id: uuid.UUID) -> CapacitySlot | None:
        result = await self.db.execute(
            select(CapacitySlot).where(CapacitySlot.id == slot_id, CapacitySlot.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_slot_for_time(self, tenant_id: uuid.UUID, weekday: int, time_str: str) -> CapacitySlot | None:
        result = await self.db.execute(
            select(CapacitySlot).where(
                CapacitySlot.tenant_id == tenant_id,
                CapacitySlot.weekday == weekday,
                CapacitySlot.start_time <= time_str,
                CapacitySlot.end_time > time_str,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> CapacitySlot:
        slot = CapacitySlot(**data)
        self.db.add(slot)
        await self.db.commit()
        await self.db.refresh(slot)
        return slot

    async def update(self, slot: CapacitySlot, data: dict) -> CapacitySlot:
        for key, value in data.items():
            setattr(slot, key, value)
        await self.db.commit()
        await self.db.refresh(slot)
        return slot
