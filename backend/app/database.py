from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables that don't exist yet, then apply additive column tweaks."""
    from . import models

    # Touch the module so import-pruners keep it: importing registers the ORM
    # models on Base.metadata, which is what create_all() needs.
    assert models is not None
    Base.metadata.create_all(bind=engine)
    _ensure_columns()


# Tiny forward-only migration for additive columns on an existing SQLite file.
# (No Alembic yet; SQLite ALTER TABLE ADD COLUMN is safe and non-locking.)
_ADDITIVE_COLUMNS: dict[str, dict[str, str]] = {
    "themes": {
        "parent_id": "VARCHAR(32)",
        "fork_count": "INTEGER NOT NULL DEFAULT 0",
    },
}


def _ensure_columns() -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, columns in _ADDITIVE_COLUMNS.items():
            if table not in existing_tables:
                continue
            present = {col["name"] for col in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in present:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
