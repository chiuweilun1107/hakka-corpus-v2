"""Proverbs router — list and random endpoints for daily_proverbs table."""

from __future__ import annotations

import json as _json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import cast, func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.dict import HakkaDict, PinyinIndex
from models.proverb import DailyProverb
from schemas.dict import PinyinByDialect
from schemas.proverb import ProverbItem, ProverbListResponse

router = APIRouter(prefix="/api/v1", tags=["proverbs"])

# 中文／客家諺語常見標點，合成拼音時保留不查字典
_PUNCT = set("，。、；：！？「」『』（）《》〈〉…—－-·．. ")

# 諺語合成支援的腔調（與辭典 pinyin_index 對齊）
_SYNTHESIZE_DIALECTS = ["四縣", "海陸", "大埔", "饒平", "詔安", "南四縣"]


@router.get("/proverbs", response_model=ProverbListResponse)
async def list_proverbs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: str | None = Query(None, description="類別過濾（諺語/歇後語/佳句）"),
    dialect: str | None = Query(None, description="腔調過濾（四縣/海陸/大埔/饒平/詔安）"),
    topic: str | None = Query(None, description="主題過濾（統一 16 類，如勸戒/處世/飲食）"),
    db: AsyncSession = Depends(get_db),
) -> ProverbListResponse:
    """列出諺語，支援分頁與類別/腔調/主題過濾。"""
    base = select(DailyProverb).where(DailyProverb.is_active.is_(True))
    if category:
        base = base.where(DailyProverb.category == category)
    if dialect:
        base = base.where(DailyProverb.dialect == dialect)
    if topic:
        base = base.where(
            text("topics @> CAST(:t AS jsonb)").bindparams(
                t=_json.dumps([{"name": topic}], ensure_ascii=False)
            )
        )

    count_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = count_result.scalar() or 0

    stmt = base.order_by(DailyProverb.id).offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return ProverbListResponse(
        total=total,
        items=[ProverbItem.model_validate(r) for r in rows],
    )


@router.get("/proverbs/random", response_model=ProverbItem)
async def random_proverb(
    db: AsyncSession = Depends(get_db),
) -> ProverbItem:
    """隨機取一則諺語。"""
    result = await db.execute(
        text("""
            SELECT id, title, pinyin, dialect, definition, example, category, topics
            FROM daily_proverbs
            WHERE is_active = true
            ORDER BY random()
            LIMIT 1
        """)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="No proverbs available")
    topics_raw = row.topics if hasattr(row, "topics") else None
    if isinstance(topics_raw, str):
        import json as _json
        topics_raw = _json.loads(topics_raw)
    return ProverbItem(
        id=row.id,
        title=row.title,
        pinyin=row.pinyin,
        dialect=row.dialect,
        definition=row.definition,
        example=row.example,
        category=row.category,
        topics=topics_raw,
    )


@router.get("/proverbs/{proverb_id}", response_model=ProverbItem)
async def get_proverb(
    proverb_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProverbItem:
    """取得單一諺語（by id）。"""
    result = await db.execute(
        select(DailyProverb).where(
            DailyProverb.id == proverb_id, DailyProverb.is_active.is_(True)
        )
    )
    proverb = result.scalar_one_or_none()
    if not proverb:
        raise HTTPException(status_code=404, detail="Proverb not found")
    return ProverbItem.model_validate(proverb)


@router.get("/proverbs/{proverb_id}/pinyin-by-dialect", response_model=list[PinyinByDialect])
async def proverb_pinyin_by_dialect(
    proverb_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[PinyinByDialect]:
    """動態合成諺語的多腔拼音：逐字查 HakkaDict + PinyinIndex 拼接。
    - 字典查無的字 → 用原字填充（保留諺語節奏）
    - 標點符號直接保留
    - 每腔只取該字的第一筆拼音
    - 回傳與 WordOfDayResponse.pinyin_by_dialect 相同結構，方便前端共用渲染邏輯
    """
    proverb = (
        await db.execute(
            select(DailyProverb).where(DailyProverb.id == proverb_id, DailyProverb.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if proverb is None:
        raise HTTPException(status_code=404, detail="Proverb not found")

    title = proverb.title or ""
    # 提取要查字典的字（去標點、去空白）
    chars_to_query = {c for c in title if c not in _PUNCT and not c.isspace()}
    if not chars_to_query:
        return []

    # 一次撈出所有字的 dict_id + dialect + pinyin，減少 round-trip
    stmt = (
        select(HakkaDict.title, PinyinIndex.dialect, PinyinIndex.pinyin_full)
        .join(PinyinIndex, PinyinIndex.dict_id == HakkaDict.id)
        .where(HakkaDict.title.in_(chars_to_query))
    )
    rows = (await db.execute(stmt)).all()

    # 建 lookup: {(char, dialect): pinyin_full}，取該字該腔第一筆即可
    lookup: dict[tuple[str, str], str] = {}
    for r in rows:
        key = (r.title, r.dialect)
        if key not in lookup:
            lookup[key] = r.pinyin_full

    # 為每個目標腔合成一段完整拼音
    result: list[PinyinByDialect] = []
    for dialect in _SYNTHESIZE_DIALECTS:
        parts: list[str] = []
        has_any = False
        for c in title:
            if c in _PUNCT or c.isspace():
                parts.append(c)
                continue
            py = lookup.get((c, dialect))
            if py:
                parts.append(py)
                has_any = True
            else:
                parts.append(c)  # 字典查無，保留原字
        if has_any:
            result.append(PinyinByDialect(dialect=dialect, pinyin_full=" ".join(parts).strip()))

    return result
