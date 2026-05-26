import secrets
import uuid
from datetime import datetime, timezone, timedelta, date

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.booking.schemas import BookingRequest, BookingResponse, AvailableSlot
from app.capacity.repository import CapacityRepository
from app.clients.repository import ClientRepository
from app.notifications.service import NotificationService
from app.scheduling.repository import AppointmentRepository
from app.tenants.repository import TenantRepository
from app.vehicles.repository import VehicleRepository


class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.tenants = TenantRepository(db)
        self.capacity = CapacityRepository(db)
        self.clients = ClientRepository(db)
        self.vehicles = VehicleRepository(db)
        self.appointments = AppointmentRepository(db)
        self.notifications = NotificationService(db)

    async def _get_tenant_or_404(self, slug: str):
        tenant = await self.tenants.get_by_slug(slug)
        if not tenant or not tenant.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Posto não encontrado")
        return tenant

    async def get_available_slots(self, slug: str, days_ahead: int = 14) -> list[AvailableSlot]:
        """
        Expands each CapacitySlot config into individual bookable time points.
        E.g. config (08:00–18:00, 60 min, 3 cars) → slots 08:00, 09:00, ..., 17:00.
        Availability is weight-aware: a large vehicle consumes 2 of the max_cars quota.
        """
        tenant = await self._get_tenant_or_404(slug)
        configs = await self.capacity.list_by_tenant(tenant.id)

        result = []
        today = date.today()
        now = datetime.now(timezone.utc)

        for delta in range(days_ahead):
            target_date = today + timedelta(days=delta)
            weekday = target_date.weekday()

            for cfg in configs:
                if cfg.weekday != weekday:
                    continue

                start_h, start_m = int(cfg.start_time[:2]), int(cfg.start_time[3:])
                end_h, end_m = int(cfg.end_time[:2]), int(cfg.end_time[3:])

                window_start = datetime(
                    target_date.year, target_date.month, target_date.day,
                    start_h, start_m, tzinfo=timezone.utc,
                )
                window_end = datetime(
                    target_date.year, target_date.month, target_date.day,
                    end_h, end_m, tzinfo=timezone.utc,
                )

                duration = timedelta(minutes=cfg.slot_duration_minutes)
                current = window_start

                while current + duration <= window_end:
                    slot_end = current + duration

                    if slot_end > now:
                        booked = await self.appointments.sum_slot_weight_in_slot(tenant.id, current, slot_end)
                        available = max(0, cfg.max_cars - booked)

                        result.append(AvailableSlot(
                            slot_id=cfg.id,
                            date=target_date.isoformat(),
                            weekday=weekday,
                            start_time=current.strftime("%H:%M"),
                            end_time=slot_end.strftime("%H:%M"),
                            available=available,
                            max_cars=cfg.max_cars,
                        ))

                    current = slot_end

        return result

    async def create_booking(self, slug: str, data: BookingRequest) -> BookingResponse:
        tenant = await self._get_tenant_or_404(slug)

        client, _ = await self.clients.get_or_create(data.phone, data.name, tenant.id)
        if client.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cliente bloqueado por histórico de no-show. Entre em contato com o posto."
            )

        scheduled_dt = data.scheduled_at
        if scheduled_dt.tzinfo is None:
            scheduled_dt = scheduled_dt.replace(tzinfo=timezone.utc)

        time_str = scheduled_dt.strftime("%H:%M")
        weekday = scheduled_dt.weekday()

        cfg = await self.capacity.get_slot_for_time(tenant.id, weekday, time_str)
        if not cfg:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Horário não disponível para este dia/hora."
            )

        slot_end = scheduled_dt + timedelta(minutes=cfg.slot_duration_minutes)

        vehicle_weight = 2 if data.size_category == "large" else 1

        booked_weight = await self.appointments.sum_slot_weight_in_slot(tenant.id, scheduled_dt, slot_end)
        if booked_weight + vehicle_weight > cfg.max_cars:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este horário já está lotado. Escolha outro."
            )

        vehicle, _ = await self.vehicles.get_or_create(
            data.plate, client.id, tenant.id,
            extra={"brand": data.brand, "model": data.model, "color": data.color, "size_category": data.size_category},
        )

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=tenant.confirmation_timeout_hours)

        appointment = await self.appointments.create({
            "tenant_id": tenant.id,
            "vehicle_id": vehicle.id,
            "client_id": client.id,
            "scheduled_at": scheduled_dt,
            "service_type": data.service_type,
            "source": "public",
            "status": "pending",
            "confirmation_token": token,
            "confirmation_expires_at": expires_at,
        })

        await self.notifications.send_booking_confirmation(tenant, client, appointment, token)

        return BookingResponse(
            appointment_id=appointment.id,
            status="pending",
            message=f"Agendamento criado! Você tem {tenant.confirmation_timeout_hours}h para confirmar pelo WhatsApp.",
        )

    async def confirm_booking(self, token: str) -> dict:
        appointment = await self.appointments.get_by_token(token)
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token inválido")
        if appointment.status != "pending":
            return {"message": "Agendamento já processado.", "status": appointment.status}
        now = datetime.now(timezone.utc)
        if appointment.confirmation_expires_at and now > appointment.confirmation_expires_at:
            await self.appointments.update(appointment, {"status": "cancelled"})
            raise HTTPException(status_code=status.HTTP_410_GONE, detail="Link de confirmação expirado.")
        await self.appointments.update(appointment, {"status": "scheduled"})
        return {"message": "Presença confirmada com sucesso!", "status": "scheduled"}
