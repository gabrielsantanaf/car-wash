import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_owner
from app.clients.schemas import ClientResponse
from app.clients.service import ClientService

router = APIRouter()


@router.get("", response_model=list[ClientResponse])
async def list_clients(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await ClientService(db).list_clients(current_user.tenant_id)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await ClientService(db).get_client(current_user.tenant_id, client_id)


@router.put("/{client_id}/unblock", response_model=ClientResponse)
async def unblock_client(client_id: uuid.UUID, current_user=Depends(require_owner), db: AsyncSession = Depends(get_db)):
    return await ClientService(db).unblock_client(current_user.tenant_id, client_id)
