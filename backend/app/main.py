from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .config import get_settings
from .database import init_db
from .ratelimit import limiter
from .routers import admin, auth, themes

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Theme Studio Marketplace API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(themes.router)
app.include_router(admin.router)


# --- Static SPA (single-image deployment only) --------------------------------
# Registered AFTER the API routers so /api/* and the docs always win.
_static_root = Path(settings.static_dir) if settings.static_dir else None
if _static_root and _static_root.is_dir():
    _index = _static_root / "index.html"

    # Hashed build assets (immutable) — long-lived cache.
    app.mount(
        "/media",
        StaticFiles(directory=_static_root / "media", check_dir=False),
        name="media",
    )

    @app.api_route("/{resource_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def spa(resource_path: str) -> FileResponse:
        if resource_path.startswith(("api/", "docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404)
        candidate = (_static_root / resource_path).resolve()
        if candidate.is_file() and candidate.is_relative_to(_static_root.resolve()):
            return FileResponse(candidate)
        return FileResponse(_index)
