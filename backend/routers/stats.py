"""Statistics overview router."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cooc import Cooccurrence
from models.dict import HakkaDict, PinyinIndex
from models.log import QueryLog
from schemas.stats import (
    DailyQuoteResponse,
    StatsOverview,
    TrendingItem,
    TrendingResponse,
)

router = APIRouter(prefix="/api/v1", tags=["stats"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STRIP_U20DE = re.compile(r"\u20DE")


def _parse_heteronyms(heteronyms: Any) -> dict[str, str]:
    """Extract pinyin, dialect, definition, example from heteronyms JSON."""
    data: list[dict[str, Any]] = []
    if isinstance(heteronyms, str):
        data = json.loads(heteronyms)
    elif isinstance(heteronyms, list):
        data = heteronyms
    else:
        return {"pinyin": "", "dialect": "", "definition": "", "example": ""}

    pinyin = ""
    dialect = ""
    definition = ""
    example = ""

    for h in data:
        if not pinyin and h.get("pinyin"):
            pinyin = _STRIP_U20DE.sub("", h["pinyin"])
        if not dialect and h.get("dialect"):
            dialect = h["dialect"]

        for d in h.get("definitions", []):
            if not definition and d.get("def"):
                definition = d["def"]
            if not example:
                examples = d.get("example", [])
                if isinstance(examples, list) and examples:
                    example = examples[0]
                elif isinstance(examples, str) and examples:
                    example = examples

        if pinyin and definition and example:
            break

    return {
        "pinyin": pinyin,
        "dialect": dialect or "四縣",
        "definition": definition,
        "example": example,
    }


# ---------------------------------------------------------------------------
# GET /stats/overview
# ---------------------------------------------------------------------------


@router.get("/stats/overview", response_model=StatsOverview)
async def stats_overview(
    db: AsyncSession = Depends(get_db),
) -> StatsOverview:
    """
    回傳語料庫統計概覽：
    - dict_count: hakka_dict 總筆數
    - cooc_count: cooccurrence 不同 word 數
    - pinyin_count: pinyin_index 總筆數
    - total_queries_today: 今日查詢次數
    """
    # dict_count
    r1 = await db.execute(select(func.count()).select_from(HakkaDict))
    dict_count = r1.scalar() or 0

    # cooc_count (distinct word)
    r2 = await db.execute(
        select(func.count(func.distinct(Cooccurrence.word)))
    )
    cooc_count = r2.scalar() or 0

    # pinyin_count
    r3 = await db.execute(select(func.count()).select_from(PinyinIndex))
    pinyin_count = r3.scalar() or 0

    # queries today
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    r4 = await db.execute(
        select(func.count())
        .select_from(QueryLog)
        .where(QueryLog.created_at >= today_start)
    )
    total_queries_today = r4.scalar() or 0

    return StatsOverview(
        dict_count=dict_count,
        cooc_count=cooc_count,
        pinyin_count=pinyin_count,
        total_queries_today=total_queries_today,
    )


# ---------------------------------------------------------------------------
# GET /stats/daily-quote
# ---------------------------------------------------------------------------


@router.get("/stats/daily-quote", response_model=DailyQuoteResponse)
async def daily_quote(
    db: AsyncSession = Depends(get_db),
) -> DailyQuoteResponse:
    """
    從 daily_proverbs 表隨機取一筆諺語/歇後語/佳句。
    """
    result = await db.execute(
        text("""
            SELECT id, title, pinyin, dialect, definition, example, category
            FROM daily_proverbs
            WHERE is_active = true
            ORDER BY random()
            LIMIT 1
        """)
    )
    row = result.first()

    if row is None:
        return DailyQuoteResponse(
            title="暫無資料",
            pinyin="",
            dialect="四縣",
            definition="語料庫尚未匯入諺語",
            example="",
        )

    return DailyQuoteResponse(
        title=row.title,
        pinyin=row.pinyin or "",
        dialect=row.dialect or "四縣",
        definition=row.definition or "",
        example=row.example or "",
    )


# ---------------------------------------------------------------------------
# GET /stats/trending
# ---------------------------------------------------------------------------

_PERIOD_MAP = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "monthly": timedelta(days=30),
    "quarterly": timedelta(days=90),
    "yearly": timedelta(days=365),
}


@router.get("/stats/trending", response_model=TrendingResponse)
async def trending(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|quarterly|yearly)$"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> TrendingResponse:
    """
    回傳指定期間的熱門查詢關鍵字。
    如果 query_log 資料不足，fallback 到 cooccurrence 表。
    """
    delta = _PERIOD_MAP.get(period, timedelta(days=30))
    cutoff = datetime.now(timezone.utc) - delta

    # Try query_log first
    result = await db.execute(
        select(
            QueryLog.query_text,
            func.count().label("cnt"),
        )
        .where(QueryLog.created_at > cutoff)
        .group_by(QueryLog.query_text)
        .order_by(func.count().desc())
        .limit(limit)
    )
    rows = result.all()

    if len(rows) >= 3:
        items = [TrendingItem(word=r.query_text, count=r.cnt) for r in rows]
        return TrendingResponse(period=period, items=items)

    # Fallback: cooccurrence table -- words with most co-occurrence partners
    result = await db.execute(
        select(
            Cooccurrence.word,
            func.count().label("cnt"),
        )
        .group_by(Cooccurrence.word)
        .order_by(func.count().desc())
        .limit(limit)
    )
    rows = result.all()
    items = [TrendingItem(word=r.word, count=r.cnt) for r in rows]

    return TrendingResponse(period=period, items=items)


# ---------------------------------------------------------------------------
# GET /stats/dialect-distribution
# ---------------------------------------------------------------------------

@router.get("/stats/dialect-distribution")
async def dialect_distribution(db: AsyncSession = Depends(get_db)):
    """各腔調的拼音索引數量分布（真實資料）"""
    result = await db.execute(
        text("SELECT dialect, count(*) as cnt FROM pinyin_index GROUP BY dialect ORDER BY cnt DESC")
    )
    rows = result.fetchall()
    return [{"name": r.dialect, "count": r.cnt} for r in rows]
