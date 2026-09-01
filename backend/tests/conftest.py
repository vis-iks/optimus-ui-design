import os

os.environ.setdefault("SESSION_SECRET", "test-secret")
os.environ.setdefault("ADMIN_GITHUB_LOGINS", "octo-admin")
os.environ.setdefault("AUTO_HIDE_REPORT_THRESHOLD", "3")
os.environ.setdefault("USER_THEME_QUOTA", "5")
os.environ.setdefault("MAX_PRESET_BYTES", "2048")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User
from app.ratelimit import limiter
from app.security import mint_session_token

limiter.enabled = False  # rate limiting off for deterministic tests

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def _fresh_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def make_user(db, *, github_id: int, login: str, is_admin: bool = False) -> User:
    user = User(
        github_id=github_id,
        github_login=login,
        avatar_url=f"https://avatars.example/{login}.png",
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_factory(db):
    counter = {"n": 1000}

    def _factory(login: str = "alice", is_admin: bool = False) -> tuple[User, dict]:
        counter["n"] += 1
        user = make_user(db, github_id=counter["n"], login=login, is_admin=is_admin)
        headers = {"Authorization": f"Bearer {mint_session_token(user)}"}
        return user, headers

    return _factory


SAMPLE_PRESET = {"primitive": {"blue": {"500": "#3b82f6"}}, "semantic": {"primary": {"color": "#3b82f6"}}}


def theme_payload(**overrides) -> dict:
    body = {
        "name": "Ocean",
        "description": "Cool blues",
        "base_preset": "Aura",
        "preset": SAMPLE_PRESET,
        "config": {"fontSize": "14px", "fontFamily": "Inter var"},
    }
    body.update(overrides)
    return body
