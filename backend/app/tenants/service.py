import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.tenants.repository import TenantRepository
from app.tenants.schemas import TenantCreate, TenantUpdate


class TenantService:
    def __init__(self, db: AsyncSession):
        self.repo = TenantRepository(db)

    async def get_me(self, tenant_id: uuid.UUID):
        tenant = await self.repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")
        return tenant

    async def create(self, data: TenantCreate):
        existing = await self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already taken")
        return await self.repo.create(data.model_dump())

    async def update(self, tenant_id: uuid.UUID, data: TenantUpdate):
        tenant = await self.get_me(tenant_id)
        updates = {k: v for k, v in data.model_dump().items() if v is not None}
        return await self.repo.update(tenant, updates)
