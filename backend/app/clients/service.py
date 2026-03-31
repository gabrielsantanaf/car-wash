import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.repository import ClientRepository


class ClientService:
    def __init__(self, db: AsyncSession):
        self.repo = ClientRepository(db)

    async def list_clients(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def get_client(self, tenant_id: uuid.UUID, client_id: uuid.UUID):
        client = await self.repo.get_by_id(client_id, tenant_id)
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        return client

    async def unblock_client(self, tenant_id: uuid.UUID, client_id: uuid.UUID):
        client = await self.get_client(tenant_id, client_id)
        return await self.repo.update(client, {"is_blocked": False, "noshow_count": 0})
