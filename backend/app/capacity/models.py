import uuid

from sqlalchemy import ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CapacitySlot(Base):
    __tablename__ = "capacity_slots"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    weekday: Mapped[int] = mapped_column(Integer)  # 0=Monday ... 6=Sunday
    start_time: Mapped[str] = mapped_column(String(5))  # "HH:MM"
    end_time: Mapped[str] = mapped_column(String(5))    # "HH:MM"
    max_cars: Mapped[int] = mapped_column(Integer, default=1)

    tenant: Mapped["Tenant"] = relationship(back_populates="capacity_slots")  # noqa: F821
