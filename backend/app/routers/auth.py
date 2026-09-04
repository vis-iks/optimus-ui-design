import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..github_oauth import build_authorize_url, exchange_code, fetch_user
from ..schemas import UserOut
from ..security import get_current_user, mint_session_token, mint_state_token, read_state_token
from ..services import upsert_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

_DEV_USER = {"id": 0, "login": "local-dev", "avatar_url": "/favicon.svg"}


def _safe_redirect(target: str | None) -> str:
    """Only allow redirects back to the configured frontend origin."""
    base = settings.frontend_url.rstrip("/")
    if target and target.startswith(base):
        return target
    return f"{base}/gallery"


@router.get("/github/login")
def github_login(redirect: str | None = None):
    if not settings.github_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "GitHub OAuth is not configured")
    state = mint_state_token(_safe_redirect(redirect), secrets.token_urlsafe(16))
    return RedirectResponse(build_authorize_url(state), status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.post("/dev-login")
def dev_login(db: Session = Depends(get_db)):
    """Mint a local session without an OAuth provider when explicitly enabled."""
    if not settings.dev_login_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    user = upsert_user(db, _DEV_USER)
    return {"token": mint_session_token(user)}


@router.get("/github/callback")
async def github_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    frontend = settings.frontend_url.rstrip("/")
    if error or not code or not state:
        return RedirectResponse(f"{frontend}/auth/callback#error=github_denied")

    redirect_to = read_state_token(state).get("redirect") or f"{frontend}/gallery"
    try:
        access_token = await exchange_code(code)
        gh_user = await fetch_user(access_token)
    except Exception:  # noqa: BLE001 - surface a generic failure to the SPA
        return RedirectResponse(f"{frontend}/auth/callback#error=github_failed")

    user = upsert_user(db, gh_user)
    session_token = mint_session_token(user)
    return RedirectResponse(f"{frontend}/auth/callback#token={session_token}&next={redirect_to}")


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    # Tokens are stateless; the client discards it. Endpoint exists for symmetry.
    return None
