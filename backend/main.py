"""FastAPI application entry point."""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from config import get_settings
from database import engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle."""
    # --- Startup ---
    # Verify DB connection
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))

    # Connect Redis
    app.state.redis = aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
    )
    try:
        await app.state.redis.ping()
    except Exception:
        # Redis is optional; log warning but don't crash
        app.state.redis = None

    yield

    # --- Shutdown ---
    if app.state.redis is not None:
        await app.state.redis.aclose()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handlers ───────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all error handler returning unified JSON format."""
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred.",
            "details": str(exc) if settings.DEBUG else None,
        },
    )


# ── Middleware: request timing ───────────────────────
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
    return response


# ── Routers ──────────────────────────────────────────
from routers import dict as dict_router
from routers import cooc as cooc_router
from routers import pinyin as pinyin_router
from routers import stats as stats_router
from routers import ai as ai_router
from routers import media as media_router

app.include_router(dict_router.router)
app.include_router(cooc_router.router)
app.include_router(pinyin_router.router)
app.include_router(stats_router.router)
app.include_router(ai_router.router)
app.include_router(media_router.router)


# ── Health check ─────────────────────────────────────
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    redis_ok = False
    if hasattr(app.state, "redis") and app.state.redis is not None:
        try:
            await app.state.redis.ping()
            redis_ok = True
        except Exception:
            pass

    db_ok = False
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "version": settings.APP_VERSION,
    }
