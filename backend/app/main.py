from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.routes.issue import router as issue_router
from app.api.routes.verify import router as verify_router
from app.api.routes.credentials import router as credentials_router
from app.db import init_db


def create_app() -> FastAPI:
    app = FastAPI(title="Verifiable Skill Credentials API", version="0.1.0")

    settings = get_settings()
    allow_origins = [o.strip() for o in settings.cors_allow_origins.split(",")] if settings.cors_allow_origins else ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(issue_router)
    app.include_router(verify_router)
    app.include_router(credentials_router)

    @app.on_event("startup")
    async def _startup():
        # Only needed when using Postgres. If DATABASE_URL isn't set, don't block startup.
        try:
            init_db()
        except Exception:
            pass

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
