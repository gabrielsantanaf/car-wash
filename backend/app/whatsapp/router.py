import asyncio
import structlog
import httpx
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.dependencies import require_owner

log = structlog.get_logger()
router = APIRouter()

EVOLUTION_HEADERS = {
    "apikey": settings.EVOLUTION_API_KEY,
    "Content-Type": "application/json",
}

# How many times to poll for the QR code after triggering connect, and delay between polls
_QR_RETRIES = 8
_QR_RETRY_DELAY = 1.5  # seconds


async def _evolution_request(method: str, path: str, **kwargs) -> tuple[int, dict]:
    url = f"{settings.EVOLUTION_API_URL}{path}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.request(method, url, headers=EVOLUTION_HEADERS, **kwargs)
        try:
            body = r.json()
        except Exception:
            body = {}
        return r.status_code, body


def _extract_qr_base64(data: dict) -> str | None:
    """Extract base64 QR image from any known Evolution API response shape."""
    # Shape 1 (connecting state): { base64: "...", code: "...", count: N }
    if data.get("base64"):
        return data["base64"]
    # Shape 2 (create with qrcode:true): { qrcode: { base64: "...", ... } }
    if isinstance(data.get("qrcode"), dict) and data["qrcode"].get("base64"):
        return data["qrcode"]["base64"]
    return None


async def _ensure_instance_exists() -> None:
    """Create the Evolution instance if it doesn't exist yet."""
    status, _ = await _evolution_request(
        "GET", f"/instance/connectionState/{settings.EVOLUTION_INSTANCE}"
    )
    if status == 404:
        log.info("whatsapp_instance_not_found_creating", instance=settings.EVOLUTION_INSTANCE)
        create_status, body = await _evolution_request(
            "POST",
            "/instance/create",
            json={"instanceName": settings.EVOLUTION_INSTANCE, "integration": "WHATSAPP-BAILEYS"},
        )
        if create_status not in (200, 201):
            raise HTTPException(status_code=502, detail=f"Failed to create Evolution instance: {body}")
        log.info("whatsapp_instance_created", instance=settings.EVOLUTION_INSTANCE)


@router.get("/status")
async def get_status(_=Depends(require_owner)):
    status, data = await _evolution_request(
        "GET", f"/instance/connectionState/{settings.EVOLUTION_INSTANCE}"
    )
    if status == 404:
        return {"state": "close"}
    if status not in (200, 201):
        raise HTTPException(status_code=502, detail="Could not reach Evolution API")
    state = data.get("instance", {}).get("state") or data.get("state", "close")
    return {"state": state}


@router.get("/qrcode")
async def get_qrcode(_=Depends(require_owner)):
    await _ensure_instance_exists()

    # Trigger connection — first call starts the Baileys handshake
    connect_status, data = await _evolution_request(
        "GET", f"/instance/connect/{settings.EVOLUTION_INSTANCE}"
    )
    if connect_status not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Evolution API error: {data}")

    qr_base64 = _extract_qr_base64(data)

    # QR generation is async inside Evolution — poll until it's ready
    for attempt in range(_QR_RETRIES):
        if qr_base64:
            break
        log.info("whatsapp_qr_not_ready_retrying", attempt=attempt + 1)
        await asyncio.sleep(_QR_RETRY_DELAY)
        _, data = await _evolution_request(
            "GET", f"/instance/connect/{settings.EVOLUTION_INSTANCE}"
        )
        qr_base64 = _extract_qr_base64(data)

    if not qr_base64:
        # Last resort: instance might already be connected
        _, state_data = await _evolution_request(
            "GET", f"/instance/connectionState/{settings.EVOLUTION_INSTANCE}"
        )
        state = state_data.get("instance", {}).get("state", "close")
        if state == "open":
            raise HTTPException(status_code=409, detail="already_connected")
        raise HTTPException(status_code=504, detail="QR code não disponível. Tente novamente em alguns segundos.")

    return {"base64": qr_base64}


@router.delete("/disconnect")
async def disconnect(_=Depends(require_owner)):
    status, data = await _evolution_request(
        "DELETE", f"/instance/logout/{settings.EVOLUTION_INSTANCE}"
    )
    if status not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Evolution API error: {data}")
    return {"status": "disconnected"}
