import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Notification:
        notification = Notification(**data)
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def get_by_id(self, notification_id: uuid.UUID, tenant_id: uuid.UUID) -> Notification | None:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()

    async def update(self, notification: Notification, data: dict) -> Notification:
        for key, value in data.items():
            setattr(notification, key, value)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification
