from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import User

ALGORITHM = "HS256"
settings = get_settings()

# auto_error=False so we can raise our own 401 with a clear message
_bearer = HTTPBearer(auto_error=False)


def _encode(claims: dict[str, Any], ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {**claims, "iat": now, "exp": now + ttl}
    return jwt.encode(payload, settings.session_secret, algorithm=ALGORITHM)


def _decode(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.session_secret, algorithms=[ALGORITHM])


def mint_session_token(user: User) -> str:
    return _encode(
        {"sub": str(user.id), "login": user.github_login, "typ": "session"},
        timedelta(days=settings.session_ttl_days),
    )


def mint_state_token(redirect: str, nonce: str) -> str:
    return _encode(
        {"redirect": redirect, "nonce": nonce, "typ": "oauth_state"},
        timedelta(minutes=settings.oauth_state_ttl_minutes),
    )


def read_state_token(token: str) -> dict[str, Any]:
    try:
        data = _decode(token)
    except JWTError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OAuth state") from exc
    if data.get("typ") != "oauth_state":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid OAuth state")
    return data


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in with GitHub to continue")
    try:
        data = _decode(creds.credentials)
    except JWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired, sign in again") from exc
    if data.get("typ") != "session":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session token")
    user = db.get(User, int(data["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists")
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if creds is None or not creds.credentials:
        return None
    try:
        return get_current_user(creds, db)
    except HTTPException:
        return None


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user
