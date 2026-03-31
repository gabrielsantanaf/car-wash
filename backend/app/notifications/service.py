import uuid
from datetime import datetime, timezone

import httpx
import structlog

from app.core.config import settings
from app.notifications.repository import NotificationRepository

log = structlog.get_logger()


class NotificationService:
    def __init__(self, db):
        self.repo = NotificationRepository(db)

    async def _send(self, phone: str, message: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{settings.NOTIFICATION_SERVICE_URL}/send",
                    json={"phone": phone, "message": message},
                )
                return response.status_code == 200
        except Exception as e:
            log.error("notification_send_error", error=str(e))
            return False

    async def send_booking_confirmation(self, tenant, client, appointment, token: str):
        confirm_url = f"{settings.APP_BASE_URL}/{tenant.slug}/confirm/{token}"
        message = (
            f"Olá {client.name}! Seu agendamento no {tenant.name} foi recebido.\n"
            f"Serviço: {appointment.service_type}\n"
            f"Confirme sua presença clicando no link: {confirm_url}\n"
            f"O link expira em {tenant.confirmation_timeout_hours}h."
        )
        notification = await self.repo.create({
            "tenant_id": tenant.id,
            "client_id": client.id,
            "appointment_id": appointment.id,
            "type": "booking_confirmation",
            "message": message,
            "status": "pending",
        })
        success = await self._send(client.phone, message)
        await self.repo.update(notification, {
            "status": "sent" if success else "failed",
            "sent_at": datetime.now(timezone.utc) if success else None,
        })

    async def send_reminder(self, tenant, client, appointment):
        message = (
            f"Olá {client.name}! Lembrete: você tem um agendamento no {tenant.name} em breve.\n"
            f"Serviço: {appointment.service_type}"
        )
        notification = await self.repo.create({
            "tenant_id": tenant.id,
            "client_id": client.id,
            "appointment_id": appointment.id,
            "type": "reminder",
            "message": message,
            "status": "pending",
        })
        success = await self._send(client.phone, message)
        await self.repo.update(notification, {
            "status": "sent" if success else "failed",
            "sent_at": datetime.now(timezone.utc) if success else None,
        })

    async def send_completion(self, tenant, client, appointment):
        message = f"Olá {client.name}! Seu veículo está pronto no {tenant.name}. Até logo!"
        notification = await self.repo.create({
            "tenant_id": tenant.id,
            "client_id": client.id,
            "appointment_id": appointment.id,
            "type": "completion",
            "message": message,
            "status": "pending",
        })
        success = await self._send(client.phone, message)
        await self.repo.update(notification, {
            "status": "sent" if success else "failed",
            "sent_at": datetime.now(timezone.utc) if success else None,
        })

    async def retry(self, db, tenant_id: uuid.UUID, notification_id: uuid.UUID):
        from app.clients.repository import ClientRepository
        notification = await self.repo.get_by_id(notification_id, tenant_id)
        if not notification:
            return None
        client_repo = ClientRepository(db)
        client = await client_repo.get_by_id(notification.client_id, tenant_id)
        if not client:
            return notification
        success = await self._send(client.phone, notification.message)
        return await self.repo.update(notification, {
            "status": "sent" if success else "failed",
            "sent_at": datetime.now(timezone.utc) if success else None,
        })
