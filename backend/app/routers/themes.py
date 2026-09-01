from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..database import get_db
from ..models import Report, Theme, User
from ..ratelimit import limiter
from ..schemas import (
    ReportCreate,
    ThemeCreate,
    ThemeFamily,
    ThemeListOut,
    ThemeOut,
    ThemeSummary,
    ThemeUpdate,
)
from ..security import get_current_user
from ..services import (
    assert_preset_within_limit,
    assert_quota_available,
    new_theme_id,
    unique_slug,
)

router = APIRouter(prefix="/api/themes", tags=["themes"])
settings = get_settings()

# Load author + the parent's summary (parent's author too) for every theme row.
_LOAD_AUTHOR = (
    selectinload(Theme.author),
    selectinload(Theme.parent).selectinload(Theme.author),
)

_MAX_FAMILY_NODES = 300


def _visible_or_404(theme: Theme | None) -> Theme:
    if theme is None or theme.is_hidden:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    return theme


@router.get("", response_model=ThemeListOut)
def list_themes(
    db: Session = Depends(get_db),
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    base: str | None = None,
    search: str | None = None,
    limit: int = Query(24, ge=1, le=60),
    offset: int = Query(0, ge=0),
):
    where = [Theme.is_hidden.is_(False)]
    if base and base != "all":
        where.append(Theme.base_preset == base)
    if search:
        term = f"%{search.strip().lower()}%"
        where.append(
            or_(func.lower(Theme.name).like(term), func.lower(Theme.description).like(term))
        )

    total = db.scalar(select(func.count()).select_from(Theme).where(*where)) or 0

    order = Theme.view_count.desc() if sort == "popular" else Theme.created_at.desc()
    rows = db.scalars(
        select(Theme)
        .options(*_LOAD_AUTHOR)
        .where(*where)
        .order_by(order, Theme.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return ThemeListOut(
        items=[ThemeOut.model_validate(t) for t in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{theme_id}", response_model=ThemeOut)
def get_theme(theme_id: str, db: Session = Depends(get_db)):
    theme = _visible_or_404(
        db.scalar(select(Theme).options(*_LOAD_AUTHOR).where(Theme.id == theme_id))
    )
    theme.view_count += 1
    db.commit()
    db.refresh(theme)
    return ThemeOut.model_validate(theme)


@router.post("", response_model=ThemeOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_theme(
    request: Request,
    payload: ThemeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    assert_preset_within_limit(payload.preset)
    assert_quota_available(db, user)

    parent: Theme | None = None
    if payload.parent_id:
        parent = _visible_or_404(db.get(Theme, payload.parent_id))

    theme = Theme(
        id=new_theme_id(),
        slug=unique_slug(db, payload.name),
        name=payload.name,
        description=payload.description or None,
        author_id=user.id,
        parent_id=parent.id if parent else None,
        preset=payload.preset,
        config=payload.config.model_dump(),
        base_preset=payload.base_preset,
    )
    db.add(theme)
    if parent is not None:
        parent.fork_count += 1
    db.commit()
    db.refresh(theme)
    return ThemeOut.model_validate(
        db.scalar(select(Theme).options(*_LOAD_AUTHOR).where(Theme.id == theme.id))
    )


@router.get("/{theme_id}/family", response_model=ThemeFamily)
def theme_family(theme_id: str, db: Session = Depends(get_db)):
    """Every visible theme connected to this one through parent links."""
    focus = _visible_or_404(
        db.scalar(select(Theme).options(selectinload(Theme.author)).where(Theme.id == theme_id))
    )

    # Walk up to the root (guard against cycles / very deep chains).
    root = focus
    seen: set[str] = {focus.id}
    while root.parent_id:
        parent = db.get(Theme, root.parent_id)
        if parent is None or parent.is_hidden or parent.id in seen:
            break
        seen.add(parent.id)
        root = parent

    # Breadth-first walk down from the root, collecting visible descendants.
    collected: dict[str, Theme] = {}
    queue: list[str] = [root.id]
    while queue and len(collected) < _MAX_FAMILY_NODES:
        current_id = queue.pop(0)
        if current_id in collected:
            continue
        node = db.scalar(
            select(Theme).options(selectinload(Theme.author)).where(Theme.id == current_id)
        )
        if node is None or node.is_hidden:
            continue
        collected[node.id] = node
        child_ids = db.scalars(
            select(Theme.id).where(Theme.parent_id == node.id, Theme.is_hidden.is_(False))
        ).all()
        queue.extend(child_ids)

    collected.setdefault(focus.id, focus)
    return ThemeFamily(
        root_id=root.id,
        focus_id=focus.id,
        nodes=[ThemeSummary.model_validate(t) for t in collected.values()],
    )


@router.patch("/{theme_id}", response_model=ThemeOut)
def update_theme(
    theme_id: str,
    payload: ThemeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    theme = db.scalar(select(Theme).options(*_LOAD_AUTHOR).where(Theme.id == theme_id))
    if theme is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    if theme.author_id != user.id and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only edit your own themes")

    data = payload.model_dump(exclude_unset=True)
    if "preset" in data and data["preset"] is not None:
        assert_preset_within_limit(data["preset"])
        theme.preset = data["preset"]
    if "config" in data and data["config"] is not None:
        theme.config = data["config"]
    if data.get("name"):
        theme.name = data["name"].strip()
    if "description" in data:
        theme.description = (data["description"] or "").strip() or None
    if data.get("base_preset"):
        theme.base_preset = data["base_preset"]

    db.commit()
    db.refresh(theme)
    return ThemeOut.model_validate(theme)


@router.delete("/{theme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_theme(
    theme_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    theme = db.get(Theme, theme_id)
    if theme is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    if theme.author_id != user.id and not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only delete your own themes")
    db.delete(theme)
    db.commit()
    return None


@router.post("/{theme_id}/report", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def report_theme(
    request: Request,
    theme_id: str,
    payload: ReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    theme = _visible_or_404(db.get(Theme, theme_id))
    if theme.author_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot report your own theme")

    existing = db.scalar(
        select(Report).where(Report.theme_id == theme_id, Report.reporter_id == user.id)
    )
    if existing is not None:
        existing.reason = payload.reason.value
        existing.details = payload.details
        existing.resolved = False
    else:
        db.add(
            Report(
                theme_id=theme_id,
                reporter_id=user.id,
                reason=payload.reason.value,
                details=payload.details,
            )
        )

    db.flush()
    theme.report_count = db.scalar(
        select(func.count()).select_from(Report).where(Report.theme_id == theme_id)
    ) or 0
    if theme.report_count >= settings.auto_hide_report_threshold:
        theme.is_hidden = True
    db.commit()
    return None
