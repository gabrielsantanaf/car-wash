import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_owner
from app.users.schemas import UserCreate, UserResponse
from app.users.service import UserService

router = APIRouter()


@router.get("", response_model=list[UserResponse])
async def list_users(current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    return await UserService(db).list_users(current_user.tenant_id)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    return await UserService(db).create_user(current_user.tenant_id, data)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    await UserService(db).delete_user(current_user.tenant_id, user_id)
