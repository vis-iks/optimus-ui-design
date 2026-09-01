import json
import re
import secrets
import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import get_settings
from .models import Theme, User

settings = get_settings()

_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    return _slug_re.sub("-", text.lower()).strip("-") or "theme"


def unique_slug(db: Session, name: str) -> str:
    base = slugify(name)[:100]
    candidate = base
    while db.scalar(select(func.count()).select_from(Theme).where(Theme.slug == candidate)):
        candidate = f"{base}-{secrets.token_hex(3)}"
    return candidate


def new_theme_id() -> str:
    return uuid.uuid4().hex


def assert_preset_within_limit(preset: dict) -> None:
    size = len(json.dumps(preset, separators=(",", ":")).encode("utf-8"))
    if size > settings.max_preset_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Preset is {size} bytes; the limit is {settings.max_preset_bytes}",
        )


def assert_quota_available(db: Session, user: User) -> None:
    owned = db.scalar(
        select(func.count()).select_from(Theme).where(Theme.author_id == user.id)
    )
    if owned is not None and owned >= settings.user_theme_quota:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"You have reached the limit of {settings.user_theme_quota} published themes",
        )


def upsert_user(db: Session, gh: dict) -> User:
    user = db.scalar(select(User).where(User.github_id == gh["id"]))
    is_admin = gh["login"].lower() in settings.admin_logins
    if user is None:
        user = User(
            github_id=gh["id"],
            github_login=gh["login"],
            avatar_url=gh["avatar_url"],
            is_admin=is_admin,
        )
        db.add(user)
    else:
        user.github_login = gh["login"]
        user.avatar_url = gh["avatar_url"]
        user.is_admin = is_admin or user.is_admin
    db.commit()
    db.refresh(user)
    return user
