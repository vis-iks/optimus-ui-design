from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

BASE_PRESETS = ("Aura", "Material", "Lara", "Nora", "custom")


class ReportReason(str, Enum):
    spam = "spam"
    offensive = "offensive"
    broken = "broken"
    copyright = "copyright"
    other = "other"


class ThemeConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fontSize: str = Field(default="14px", max_length=16)
    fontFamily: str = Field(default="Inter var", max_length=64)


class AuthorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    github_login: str
    avatar_url: str


class ThemeBase(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    description: str | None = Field(default=None, max_length=200)
    base_preset: str = "custom"

    @field_validator("name", "description")
    @classmethod
    def _strip(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v

    @field_validator("base_preset")
    @classmethod
    def _known_base(cls, v: str) -> str:
        return v if v in BASE_PRESETS else "custom"


class ThemeCreate(ThemeBase):
    preset: dict[str, Any]
    config: ThemeConfig = ThemeConfig()
    parent_id: str | None = None

    @field_validator("preset")
    @classmethod
    def _preset_is_object(cls, v: Any) -> dict:
        if not isinstance(v, dict) or not v:
            raise ValueError("preset must be a non-empty object")
        return v


class ThemeSummary(BaseModel):
    """Lightweight node for lineage trees and parent references."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name: str
    base_preset: str
    author: AuthorOut
    parent_id: str | None
    fork_count: int
    created_at: datetime


class ThemeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=60)
    description: str | None = Field(default=None, max_length=200)
    base_preset: str | None = None
    preset: dict[str, Any] | None = None
    config: ThemeConfig | None = None


class ThemeOut(ThemeBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    preset: dict[str, Any]
    config: dict[str, Any]
    author: AuthorOut
    parent_id: str | None
    parent: ThemeSummary | None
    report_count: int
    view_count: int
    fork_count: int
    created_at: datetime
    updated_at: datetime


class ThemeListOut(BaseModel):
    items: list[ThemeOut]
    total: int
    limit: int
    offset: int


class ThemeFamily(BaseModel):
    """A theme's full lineage: every node connected to it through parent links."""

    root_id: str
    focus_id: str
    nodes: list[ThemeSummary]


class ReportCreate(BaseModel):
    reason: ReportReason
    details: str | None = Field(default=None, max_length=1000)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    github_login: str
    avatar_url: str
    is_admin: bool


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reason: str
    details: str | None
    resolved: bool
    created_at: datetime
    theme: ThemeOut
    reporter: AuthorOut


class ResolveAction(BaseModel):
    action: Literal["dismiss", "hide", "delete"]


class VisibilityUpdate(BaseModel):
    is_hidden: bool
