import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_owner_or_attendant
from app.capacity.schemas import CapacitySlotCreate, CapacitySlotUpdate, CapacitySlotResponse
from app.capacity.service import CapacityService

router = APIRouter()


@router.get("", response_model=list[CapacitySlotResponse])
async def list_slots(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await CapacityService(db).list_slots(current_user.tenant_id)


@router.post("", response_model=CapacitySlotResponse, status_code=201)
async def create_slot(data: CapacitySlotCreate, current_user=Depends(require_owner_or_attendant), db: AsyncSession = Depends(get_db)):
    return await CapacityService(db).create_slot(current_user.tenant_id, data)


@router.put("/{slot_id}", response_model=CapacitySlotResponse)
async def update_slot(slot_id: uuid.UUID, data: CapacitySlotUpdate, current_user=Depends(require_owner_or_attendant), db: AsyncSession = Depends(get_db)):
    return await CapacityService(db).update_slot(current_user.tenant_id, slot_id, data)
