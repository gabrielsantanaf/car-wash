import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.vehicles.repository import VehicleRepository
from app.vehicles.schemas import VehicleCreate


class VehicleService:
    def __init__(self, db: AsyncSession):
        self.repo = VehicleRepository(db)

    async def list_by_client(self, client_id: uuid.UUID, tenant_id: uuid.UUID):
        return await self.repo.list_by_client(client_id, tenant_id)

    async def create(self, tenant_id: uuid.UUID, data: VehicleCreate):
        return await self.repo.create({**data.model_dump(), "tenant_id": tenant_id})
