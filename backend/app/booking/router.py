from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.booking.schemas import BookingRequest, BookingResponse, AvailableSlot
from app.booking.service import BookingService

router = APIRouter()


@router.get("/{slug}/slots", response_model=list[AvailableSlot])
async def get_slots(slug: str, db: AsyncSession = Depends(get_db)):
    return await BookingService(db).get_available_slots(slug)


@router.post("/{slug}", response_model=BookingResponse, status_code=201)
async def create_booking(slug: str, data: BookingRequest, db: AsyncSession = Depends(get_db)):
    return await BookingService(db).create_booking(slug, data)


@router.get("/confirm/{token}")
async def confirm_booking(token: str, db: AsyncSession = Depends(get_db)):
    return await BookingService(db).confirm_booking(token)
