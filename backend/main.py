import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.auth.router import router as auth_router
from app.tenants.router import router as tenants_router
from app.users.router import router as users_router
from app.clients.router import router as clients_router
from app.vehicles.router import router as vehicles_router
from app.booking.router import router as booking_router
from app.scheduling.router import router as scheduling_router
from app.capacity.router import router as capacity_router
from app.queue.router import router as queue_router
from app.notifications.router import router as notifications_router
from app.core.scheduler import start_scheduler, stop_scheduler

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="CarWash SaaS API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else [settings.APP_BASE_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(tenants_router, prefix="/tenants", tags=["tenants"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(clients_router, prefix="/clients", tags=["clients"])
app.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
app.include_router(booking_router, prefix="/booking", tags=["booking"])
app.include_router(scheduling_router, prefix="/appointments", tags=["scheduling"])
app.include_router(capacity_router, prefix="/capacity", tags=["capacity"])
app.include_router(queue_router, prefix="/queue", tags=["queue"])
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])


@app.get("/health")
async def health():
    return {"status": "ok"}
