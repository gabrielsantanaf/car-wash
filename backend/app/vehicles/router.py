import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.vehicles.schemas import VehicleCreate, VehicleResponse
from app.vehicles.service import VehicleService

router = APIRouter()


@router.get("/client/{client_id}", response_model=list[VehicleResponse])
async def list_vehicles(client_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await VehicleService(db).list_by_client(client_id, current_user.tenant_id)


@router.post("", response_model=VehicleResponse, status_code=201)
async def create_vehicle(data: VehicleCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await VehicleService(db).create(current_user.tenant_id, data)
