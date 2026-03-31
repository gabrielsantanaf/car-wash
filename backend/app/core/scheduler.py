import asyncio
from datetime import datetime, timezone, timedelta

import structlog
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.database import AsyncSessionLocal

log = structlog.get_logger()
scheduler = BackgroundScheduler()


def start_scheduler():
    scheduler.add_job(run_expire_confirmations, "interval", minutes=5, id="expire_confirmations")
    scheduler.add_job(run_send_reminders, "interval", minutes=15, id="send_reminders")
    scheduler.start()
    log.info("scheduler_started")


def stop_scheduler():
    scheduler.shutdown(wait=False)


def run_expire_confirmations():
    asyncio.run(_expire_confirmations())


def run_send_reminders():
    asyncio.run(_send_reminders())


async def _expire_confirmations():
    """Cancel appointments whose confirmation link expired without being confirmed."""
    from sqlalchemy import select, and_
    from app.scheduling.models import Appointment
    from app.clients.models import Client
    from app.tenants.models import Tenant

    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Appointment).where(
                and_(
                    Appointment.status == "pending",
                    Appointment.confirmation_expires_at < now,
                )
            )
        )
        expired = result.scalars().all()

        for appt in expired:
            appt.status = "cancelled"
            # Increment noshow_count for client
            client_result = await db.execute(
                select(Client).where(Client.id == appt.client_id)
            )
            client = client_result.scalar_one_or_none()
            if client:
                client.noshow_count += 1
                tenant_result = await db.execute(
                    select(Tenant).where(Tenant.id == appt.tenant_id)
                )
                tenant = tenant_result.scalar_one_or_none()
                if tenant and client.noshow_count >= tenant.max_noshows:
                    client.is_blocked = True
                    log.info("client_blocked", client_id=str(client.id), noshow_count=client.noshow_count)

        if expired:
            await db.commit()
            log.info("expired_appointments_cancelled", count=len(expired))


async def _send_reminders():
    """Send reminder WhatsApp messages for appointments scheduled in the next 2 hours."""
    from sqlalchemy import select, and_
    from app.scheduling.models import Appointment
    from app.clients.models import Client
    from app.tenants.models import Tenant
    from app.notifications.models import Notification
    from app.notifications.service import NotificationService

    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        window_start = now + timedelta(hours=1, minutes=45)
        window_end = now + timedelta(hours=2, minutes=15)

        # Find scheduled appointments in the reminder window
        result = await db.execute(
            select(Appointment).where(
                and_(
                    Appointment.status == "scheduled",
                    Appointment.scheduled_at >= window_start,
                    Appointment.scheduled_at <= window_end,
                )
            )
        )
        appointments = result.scalars().all()

        for appt in appointments:
            # Check if reminder was already sent
            existing = await db.execute(
                select(Notification).where(
                    and_(
                        Notification.appointment_id == appt.id,
                        Notification.type == "reminder",
                        Notification.status == "sent",
                    )
                )
            )
            if existing.scalar_one_or_none():
                continue

            tenant_result = await db.execute(select(Tenant).where(Tenant.id == appt.tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            client_result = await db.execute(select(Client).where(Client.id == appt.client_id))
            client = client_result.scalar_one_or_none()

            if tenant and client:
                svc = NotificationService(db)
                await svc.send_reminder(tenant, client, appt)
                log.info("reminder_sent", appointment_id=str(appt.id))
