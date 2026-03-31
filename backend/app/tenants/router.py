import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_owner
from app.core.security import hash_password
from app.tenants.schemas import TenantCreate, TenantUpdate, TenantResponse
from app.tenants.service import TenantService
from app.users.repository import UserRepository

router = APIRouter()


class SetupOwnerRequest(BaseModel):
    tenant_id: uuid.UUID
    name: str
    email: str
    password: str


@router.post("/setup/owner", status_code=201, tags=["setup"])
async def setup_owner(data: SetupOwnerRequest, db: AsyncSession = Depends(get_db)):
    """Creates the first owner for a tenant. Only works if the tenant has no users yet."""
    from app.tenants.repository import TenantRepository
    from sqlalchemy import select
    from app.users.models import User

    tenant = await TenantRepository(db).get_by_id(data.tenant_id)
    if not tenant:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=404, detail="Tenant not found")

    result = await db.execute(
        select(User).where(User.tenant_id == data.tenant_id, User.role == "owner")
    )
    if result.scalar_one_or_none():
        from fastapi import HTTPException, status
        raise HTTPException(status_code=409, detail="Tenant already has an owner")

    user = User(
        tenant_id=data.tenant_id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="owner",
    )
    db.add(user)
    await db.commit()
    return {"message": "Owner created successfully"}


@router.get("/exists", tags=["setup"])
async def tenant_exists(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns whether any tenant has been configured."""
    from sqlalchemy import select, func
    from app.tenants.models import Tenant
    result = await db.execute(select(func.count()).select_from(Tenant))
    count = result.scalar_one()
    return {"exists": count > 0}


@router.get("/me", response_model=TenantResponse)
async def get_me(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await TenantService(db).get_me(current_user.tenant_id)


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(data: TenantCreate, db: AsyncSession = Depends(get_db)):
    return await TenantService(db).create(data)


@router.patch("/me", response_model=TenantResponse)
async def update_tenant(
    data: TenantUpdate,
    current_user=Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    return await TenantService(db).update(current_user.tenant_id, data)
