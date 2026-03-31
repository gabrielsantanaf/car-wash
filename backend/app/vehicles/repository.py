import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.vehicles.models import Vehicle


class VehicleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_client(self, client_id: uuid.UUID, tenant_id: uuid.UUID) -> list[Vehicle]:
        result = await self.db.execute(
            select(Vehicle).where(Vehicle.client_id == client_id, Vehicle.tenant_id == tenant_id)
        )
        return list(result.scalars().all())

    async def get_by_plate(self, plate: str, tenant_id: uuid.UUID) -> Vehicle | None:
        result = await self.db.execute(
            select(Vehicle).where(Vehicle.plate == plate, Vehicle.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Vehicle:
        vehicle = Vehicle(**data)
        self.db.add(vehicle)
        await self.db.commit()
        await self.db.refresh(vehicle)
        return vehicle

    async def get_or_create(self, plate: str, client_id: uuid.UUID, tenant_id: uuid.UUID, extra: dict = {}) -> tuple[Vehicle, bool]:
        vehicle = await self.get_by_plate(plate, tenant_id)
        if vehicle:
            return vehicle, False
        vehicle = await self.create({"plate": plate, "client_id": client_id, "tenant_id": tenant_id, **extra})
        return vehicle, True
