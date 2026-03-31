import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.users.repository import UserRepository
from app.users.schemas import UserCreate


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def list_users(self, tenant_id: uuid.UUID):
        return await self.repo.list_by_tenant(tenant_id)

    async def create_user(self, tenant_id: uuid.UUID, data: UserCreate):
        existing = await self.repo.get_by_email(data.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        if data.role not in ("owner", "attendant", "washer"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")
        return await self.repo.create({
            "tenant_id": tenant_id,
            "name": data.name,
            "email": data.email,
            "password_hash": hash_password(data.password),
            "role": data.role,
        })

    async def delete_user(self, tenant_id: uuid.UUID, user_id: uuid.UUID):
        user = await self.repo.get_by_id(user_id)
        if not user or user.tenant_id != tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        await self.repo.delete(user)
