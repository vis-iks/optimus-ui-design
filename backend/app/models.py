from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    github_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    github_login: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    themes: Mapped[list["Theme"]] = relationship(
        back_populates="author", cascade="all, delete-orphan"
    )


class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("themes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    fork_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    preset: Mapped[dict] = mapped_column(JSON, nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    base_preset: Mapped[str] = mapped_column(String(20), default="custom", nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    report_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    author: Mapped[User] = relationship(back_populates="themes")
    parent: Mapped["Theme | None"] = relationship(
        "Theme", remote_side=[id], backref="children"
    )
    reports: Mapped[list["Report"]] = relationship(
        back_populates="theme", cascade="all, delete-orphan"
    )


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (UniqueConstraint("theme_id", "reporter_id", name="uq_report_theme_reporter"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    theme_id: Mapped[str] = mapped_column(ForeignKey("themes.id", ondelete="CASCADE"), index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reason: Mapped[str] = mapped_column(String(20), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    theme: Mapped[Theme] = relationship(back_populates="reports")
    reporter: Mapped[User] = relationship()
