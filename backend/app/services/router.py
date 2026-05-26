import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_owner
from app.services.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services.service import ServiceService

router = APIRouter()


@router.get("/public/{slug}", response_model=list[ServiceResponse])
async def list_public_services(slug: str, db: AsyncSession = Depends(get_db)):
    return await ServiceService(db).list_public(slug)


@router.get("", response_model=list[ServiceResponse])
async def list_services(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await ServiceService(db).list_for_owner(current_user.tenant_id)


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(data: ServiceCreate, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    return await ServiceService(db).create(current_user.tenant_id, data)


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: uuid.UUID, data: ServiceUpdate, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    return await ServiceService(db).update(current_user.tenant_id, service_id, data)


@router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: uuid.UUID, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    await ServiceService(db).delete(current_user.tenant_id, service_id)
