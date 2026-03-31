import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.notifications.schemas import NotificationResponse
from app.notifications.service import NotificationService

router = APIRouter()


@router.post("/retry/{notification_id}", response_model=NotificationResponse)
async def retry_notification(notification_id: uuid.UUID, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = NotificationService(db)
    result = await service.retry(db, current_user.tenant_id, notification_id)
    return result
