import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_owner_or_attendant
from app.scheduling.schemas import AppointmentCreate, AppointmentStatusUpdate, AppointmentResponse
from app.scheduling.service import SchedulingService

router = APIRouter()


@router.get("", response_model=list[AppointmentResponse])
async def list_appointments(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await SchedulingService(db).list_appointments(current_user.tenant_id)


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(data: AppointmentCreate, current_user=Depends(require_owner_or_attendant), db: AsyncSession = Depends(get_db)):
    return await SchedulingService(db).create_appointment(current_user.tenant_id, data)


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_status(appointment_id: uuid.UUID, data: AppointmentStatusUpdate, current_user=Depends(require_owner_or_attendant), db: AsyncSession = Depends(get_db)):
    return await SchedulingService(db).update_status(current_user.tenant_id, appointment_id, data)
