import structlog
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

log = structlog.get_logger()
router = APIRouter()


class SendRequest(BaseModel):
    phone: str
    message: str


@router.post("/send")
async def send_message(data: SendRequest):
    # Normalize phone: remove non-digits, ensure country code
    phone = "".join(filter(str.isdigit, data.phone))
    if not phone.startswith("55"):
        phone = "55" + phone

    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}"
    headers = {"apikey": settings.EVOLUTION_API_KEY, "Content-Type": "application/json"}
    payload = {
        "number": phone,
        "options": {"delay": 1200, "presence": "composing"},
        "textMessage": {"text": data.message},
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code not in (200, 201):
                log.error("evolution_api_error", status=response.status_code, body=response.text)
                raise HTTPException(status_code=502, detail="Failed to send WhatsApp message")
            log.info("message_sent", phone=phone)
            return {"status": "sent"}
    except httpx.TimeoutException:
        log.error("evolution_api_timeout", phone=phone)
        raise HTTPException(status_code=504, detail="Evolution API timeout")


@router.get("/health")
async def health():
    return {"status": "ok"}
