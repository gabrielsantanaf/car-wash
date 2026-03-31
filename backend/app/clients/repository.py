import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.models import Client


class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, client_id: uuid.UUID, tenant_id: uuid.UUID) -> Client | None:
        result = await self.db.execute(
            select(Client).where(Client.id == client_id, Client.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str, tenant_id: uuid.UUID) -> Client | None:
        result = await self.db.execute(
            select(Client).where(Client.phone == phone, Client.tenant_id == tenant_id)
        )
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[Client]:
        result = await self.db.execute(select(Client).where(Client.tenant_id == tenant_id))
        return list(result.scalars().all())

    async def create(self, data: dict) -> Client:
        client = Client(**data)
        self.db.add(client)
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def update(self, client: Client, data: dict) -> Client:
        for key, value in data.items():
            setattr(client, key, value)
        await self.db.commit()
        await self.db.refresh(client)
        return client

    async def get_or_create(self, phone: str, name: str, tenant_id: uuid.UUID) -> tuple[Client, bool]:
        client = await self.get_by_phone(phone, tenant_id)
        if client:
            return client, False
        client = await self.create({"phone": phone, "name": name, "tenant_id": tenant_id})
        return client, True
