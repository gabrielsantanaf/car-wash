import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.models import Service


class ServiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_tenant(self, tenant_id: uuid.UUID, active_only: bool = False) -> list[Service]:
        q = select(Service).where(Service.tenant_id == tenant_id)
        if active_only:
            q = q.where(Service.is_active == True)  # noqa: E712
        q = q.order_by(Service.sort_order, Service.created_at)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_by_id(self, service_id: uuid.UUID, tenant_id: uuid.UUID) -> Service | None:
        result = await self.db.execute(
            select(Service).where(Service.id == service_id, Service.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Service:
        service = Service(**data)
        self.db.add(service)
        await self.db.commit()
        await self.db.refresh(service)
        return service

    async def update(self, service: Service, data: dict) -> Service:
        for key, value in data.items():
            setattr(service, key, value)
        await self.db.commit()
        await self.db.refresh(service)
        return service

    async def delete(self, service: Service) -> None:
        await self.db.delete(service)
        await self.db.commit()

    async def seed_defaults(self, tenant_id: uuid.UUID) -> None:
        defaults = [
            ("Lavagem Simples",      "Exterior completo",   0),
            ("Lavagem Completa",     "Interno + externo",   1),
            ("Enceramento",          "Proteção e brilho",   2),
            ("Polimento",            "Remove riscos leves", 3),
            ("Higienização Interna", "Interior completo",   4),
        ]
        for name, desc, order in defaults:
            await self.create({
                "tenant_id": tenant_id,
                "name": name,
                "description": desc,
                "sort_order": order,
            })
