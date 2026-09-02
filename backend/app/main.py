"""
FastAPI application — production entry point.

Run:  uvicorn app.main:app --host 0.0.0.0 --port 8000
Docs: /docs  ·  Health: /health
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app import __version__
from app.api import auth, chat, documents, faculty, progress, projects
from app.core.config import settings
from app.database.session import Base, SessionLocal, engine
from app.services.seed import seed_demo_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
)
logger = logging.getLogger("aapm")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Ensure models import so metadata is complete.
    import app.models.chat  # noqa: F401
    import app.models.document  # noqa: F401
    import app.models.project  # noqa: F401
    import app.models.user  # noqa: F401

    logger.info("Creating tables if missing (use Alembic for managed migrations)…")
    Base.metadata.create_all(bind=engine)
    if settings.demo_mode:
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
    logger.info("Startup complete — LLM provider: %s", settings.resolved_llm_provider)
    yield
    logger.info("Shutting down…")


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["ops"])
def health() -> dict[str, str]:
    """Liveness + DB connectivity + provider status (no secrets exposed)."""
    db_status = "ok"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"
    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "version": __version__,
        "database": db_status,
        "llmProvider": settings.resolved_llm_provider,
    }


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": "Validation failed", "errors": jsonable_encoder(exc.errors())})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(projects.router, prefix=settings.api_prefix)
app.include_router(chat.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(progress.router, prefix=settings.api_prefix)
app.include_router(faculty.router, prefix=settings.api_prefix)
