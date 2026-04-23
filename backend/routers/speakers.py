"""Speakers router — oral corpus informants."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.speaker import Speaker
from schemas.speaker import SpeakerItem, SpeakerListResponse

router = APIRouter(prefix="/api/v1", tags=["speakers"])


@router.get("/speakers", response_model=SpeakerListResponse)
async def list_speakers(
    dialect: str | None = Query(None, description="腔調過濾"),
    limit:   int        = Query(20, ge=1, le=50),
    offset:  int        = Query(0,  ge=0),
    db:      AsyncSession = Depends(get_db),
) -> SpeakerListResponse:
    base = select(Speaker).where(Speaker.is_active.is_(True))
    if dialect:
        base = base.where(Speaker.dialect == dialect)

    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar() or 0

    stmt = base.order_by(Speaker.sort_order, Speaker.id).offset(offset).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()

    return SpeakerListResponse(
        total=total,
        items=[SpeakerItem.model_validate(r) for r in rows],
    )


@router.get("/speakers/{speaker_id}", response_model=SpeakerItem)
async def get_speaker(
    speaker_id: int,
    db:         AsyncSession = Depends(get_db),
) -> SpeakerItem:
    row = (
        await db.execute(
            select(Speaker).where(Speaker.id == speaker_id, Speaker.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Speaker not found")
    return SpeakerItem.model_validate(row)
