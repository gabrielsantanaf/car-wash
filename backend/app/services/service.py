import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.repository import ServiceRepository
from app.services.schemas import ServiceCreate, ServiceUpdate
from app.tenants.repository import TenantRepository


class ServiceService:
    def __init__(self, db: AsyncSession):
        self.repo = ServiceRepository(db)
        self.tenants = TenantRepository(db)

    async def list_for_owner(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def list_public(self, slug: str):
        tenant = await self.tenants.get_by_slug(slug)
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Posto não encontrado")
        return await self.repo.list_by_tenant(tenant.id, active_only=True)

    async def create(self, tenant_id: uuid.UUID, data: ServiceCreate):
        return await self.repo.create({**data.model_dump(), "tenant_id": tenant_id})

    async def update(self, tenant_id: uuid.UUID, service_id: uuid.UUID, data: ServiceUpdate):
        svc = await self.repo.get_by_id(service_id, tenant_id)
        if not svc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
        updates = data.model_dump(exclude_unset=True)
        return await self.repo.update(svc, updates)

    async def delete(self, tenant_id: uuid.UUID, service_id: uuid.UUID):
        svc = await self.repo.get_by_id(service_id, tenant_id)
        if not svc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
        await self.repo.delete(svc)
