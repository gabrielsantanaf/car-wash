import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.vehicles.models import Vehicle
from app.vehicles.repository import VehicleRepository
from app.vehicles.schemas import VehicleCreate


class VehicleService:
    def __init__(self, db: AsyncSession):
        self.repo = VehicleRepository(db)
        self.db = db

    async def list_by_client(self, client_id: uuid.UUID, tenant_id: uuid.UUID):
        return await self.repo.list_by_client(client_id, tenant_id)

    async def create(self, tenant_id: uuid.UUID, data: VehicleCreate):
        return await self.repo.create({**data.model_dump(), "tenant_id": tenant_id})

    async def update_size(self, vehicle_id: uuid.UUID, tenant_id: uuid.UUID, size_category: str):
        result = await self.db.execute(
            select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.tenant_id == tenant_id)
        )
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Veículo não encontrado")
        vehicle.size_category = size_category
        await self.db.commit()
        await self.db.refresh(vehicle)
        return vehicle
