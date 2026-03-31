import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.capacity.repository import CapacityRepository
from app.capacity.schemas import CapacitySlotCreate, CapacitySlotUpdate


class CapacityService:
    def __init__(self, db: AsyncSession):
        self.repo = CapacityRepository(db)

    async def list_slots(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def create_slot(self, tenant_id: uuid.UUID, data: CapacitySlotCreate):
        return await self.repo.create({**data.model_dump(), "tenant_id": tenant_id})

    async def update_slot(self, tenant_id: uuid.UUID, slot_id: uuid.UUID, data: CapacitySlotUpdate):
        slot = await self.repo.get_by_id(slot_id, tenant_id)
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return await self.repo.update(slot, updates)
