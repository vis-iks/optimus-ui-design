from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Report, Theme
from ..schemas import ReportOut, ResolveAction, ThemeOut, VisibilityUpdate
from ..security import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/reports", response_model=list[ReportOut])
def list_reports(resolved: bool = False, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Report)
        .options(
            selectinload(Report.theme).selectinload(Theme.author),
            selectinload(Report.theme).selectinload(Theme.parent).selectinload(Theme.author),
            selectinload(Report.reporter),
        )
        .where(Report.resolved.is_(resolved))
        .order_by(Report.created_at.desc())
    ).all()
    return [ReportOut.model_validate(r) for r in rows]


@router.post("/reports/{report_id}/resolve", status_code=status.HTTP_204_NO_CONTENT)
def resolve_report(report_id: int, body: ResolveAction, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    theme = db.get(Theme, report.theme_id)

    if body.action == "delete":
        if theme is not None:
            db.delete(theme)
        db.commit()
        return None

    if theme is not None:
        theme.is_hidden = body.action == "hide"
    # mark every open report on this theme resolved
    for r in db.scalars(
        select(Report).where(Report.theme_id == report.theme_id, Report.resolved.is_(False))
    ):
        r.resolved = True
    db.commit()
    return None


@router.post("/themes/{theme_id}/visibility", response_model=ThemeOut)
def set_visibility(theme_id: str, body: VisibilityUpdate, db: Session = Depends(get_db)):
    theme = db.scalar(
        select(Theme)
        .options(
            selectinload(Theme.author),
            selectinload(Theme.parent).selectinload(Theme.author),
        )
        .where(Theme.id == theme_id)
    )
    if theme is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Theme not found")
    theme.is_hidden = body.is_hidden
    db.commit()
    db.refresh(theme)
    return ThemeOut.model_validate(theme)
