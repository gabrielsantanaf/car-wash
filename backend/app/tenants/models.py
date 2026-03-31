import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    phone_number: Mapped[str | None] = mapped_column(String(20))
    confirmation_timeout_hours: Mapped[int] = mapped_column(Integer, default=2)
    cancellation_min_hours: Mapped[int] = mapped_column(Integer, default=2)
    max_noshows: Mapped[int] = mapped_column(Integer, default=3)
    plan: Mapped[str] = mapped_column(String(50), default="starter")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users: Mapped[list["User"]] = relationship(back_populates="tenant")  # noqa: F821
    clients: Mapped[list["Client"]] = relationship(back_populates="tenant")  # noqa: F821
    capacity_slots: Mapped[list["CapacitySlot"]] = relationship(back_populates="tenant")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="tenant")  # noqa: F821
