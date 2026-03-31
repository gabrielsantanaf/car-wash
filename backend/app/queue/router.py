import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_any
from app.queue.schemas import QueueEntryResponse, QueueStatusUpdate
from app.queue.service import QueueService

router = APIRouter()


@router.get("", response_model=list[QueueEntryResponse])
async def list_queue(current_user=Depends(require_any), db: AsyncSession = Depends(get_db)):
    return await QueueService(db).list_queue(current_user.tenant_id)


@router.post("/{appointment_id}", response_model=QueueEntryResponse, status_code=201)
async def add_to_queue(appointment_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await QueueService(db).add_to_queue(current_user.tenant_id, appointment_id)


@router.put("/{entry_id}/status", response_model=QueueEntryResponse)
async def update_status(entry_id: uuid.UUID, data: QueueStatusUpdate, current_user=Depends(require_any), db: AsyncSession = Depends(get_db)):
    return await QueueService(db).update_status(current_user.tenant_id, entry_id, data)
