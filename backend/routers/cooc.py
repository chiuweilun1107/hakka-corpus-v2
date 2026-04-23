"""Cooccurrence query router."""

from __future__ import annotations

import time
from enum import Enum

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cooc import Cooccurrence
from models.log import QueryLog
from schemas.cooc import CoocItem, CoocPairItem, CoocResponse

router = APIRouter(prefix="/api/v1", tags=["cooc"])


class SortField(str, Enum):
    logdice = "logdice"
    mi = "mi"
    freq = "freq"


_SORT_MAP = {
    SortField.logdice: Cooccurrence.logdice.desc(),
    SortField.mi: Cooccurrence.mi_score.desc(),
    SortField.freq: Cooccurrence.co_count.desc(),
}


async def _log_query(
    db: AsyncSession,
    query_text: str,
    query_type: str,
    result_count: int,
    response_ms: int,
) -> None:
    log = QueryLog(
        query_text=query_text,
        query_type=query_type,
        result_count=result_count,
        response_ms=response_ms,
    )
    db.add(log)
    await db.commit()


@router.get("/cooc", response_model=CoocResponse)
async def query_cooccurrence(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    sort: SortField = Query(SortField.logdice, description="排序方式"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> CoocResponse:
    """
    共現詞查詢：查 cooccurrence 表，word = q，支援三種排序。
    若精確查不到，改用 LIKE 模糊查。
    """
    start = time.perf_counter()

    order_clause = _SORT_MAP[sort]

    # 精確查
    count_stmt = (
        select(func.count())
        .select_from(Cooccurrence)
        .where(Cooccurrence.word == q)
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    use_fuzzy = total == 0

    if use_fuzzy:
        like_pattern = f"%{q}%"
        count_stmt_fuzzy = (
            select(func.count())
            .select_from(Cooccurrence)
            .where(Cooccurrence.word.like(like_pattern))
        )
        total_result = await db.execute(count_stmt_fuzzy)
        total = total_result.scalar() or 0

        stmt = (
            select(Cooccurrence)
            .where(Cooccurrence.word.like(like_pattern))
            .order_by(order_clause)
            .offset(offset)
            .limit(limit)
        )
    else:
        stmt = (
            select(Cooccurrence)
            .where(Cooccurrence.word == q)
            .order_by(order_clause)
            .offset(offset)
            .limit(limit)
        )

    result = await db.execute(stmt)
    rows = result.scalars().all()

    items = [
        CoocItem(
            partner=row.partner,
            co_count=row.co_count,
            logdice=float(row.logdice),
            mi_score=float(row.mi_score),
            word_freq=row.word_freq,
        )
        for row in rows
    ]

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "cooc", len(items), elapsed_ms)

    return CoocResponse(
        word=q,
        total=total,
        sort_by=sort.value,
        results=items,
    )


@router.get("/cooc/categories", response_model=CoocResponse)
async def cooc_categories(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    limit: int = Query(8, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> CoocResponse:
    """
    Word Sketch 用：取 top N 共現詞（後續再加語法分類邏輯）。
    目前直接回傳 logDice 排序的前 N 筆。
    """
    start = time.perf_counter()

    count_stmt = (
        select(func.count())
        .select_from(Cooccurrence)
        .where(Cooccurrence.word == q)
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = (
        select(Cooccurrence)
        .where(Cooccurrence.word == q)
        .order_by(Cooccurrence.logdice.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    items = [
        CoocItem(
            partner=row.partner,
            co_count=row.co_count,
            logdice=float(row.logdice),
            mi_score=float(row.mi_score),
            word_freq=row.word_freq,
        )
        for row in rows
    ]

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "cooc_categories", len(items), elapsed_ms)

    return CoocResponse(
        word=q,
        total=total,
        sort_by="logdice",
        results=items,
    )


@router.get("/cooc/top", response_model=list[CoocPairItem])
async def cooc_top_global(
    limit: int = Query(30, ge=1, le=100),
    sort: SortField = Query(SortField.logdice),
    db: AsyncSession = Depends(get_db),
) -> list[CoocPairItem]:
    """全域共現詞 top N，不依特定詞查詢。"""
    stmt = (
        select(Cooccurrence)
        .order_by(_SORT_MAP[sort])
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [
        CoocPairItem(
            word=row.word,
            partner=row.partner,
            co_count=row.co_count,
            logdice=float(row.logdice),
            mi_score=float(row.mi_score),
            word_freq=row.word_freq,
        )
        for row in result.scalars().all()
    ]


@router.get("/cooc/random-pair", response_model=CoocPairItem)
async def random_cooc_pair(
    db: AsyncSession = Depends(get_db),
) -> CoocPairItem:
    """隨機取一組共現詞對。用 TABLESAMPLE SYSTEM 取樣，效能優先。"""
    result = await db.execute(
        text("""
            SELECT word, partner, co_count, logdice, mi_score, word_freq
            FROM cooccurrence TABLESAMPLE SYSTEM (0.1)
            LIMIT 1
        """)
    )
    row = result.first()
    if row is None:
        # TABLESAMPLE 可能返回空，fallback 到 random()
        result2 = await db.execute(
            text("""
                SELECT word, partner, co_count, logdice, mi_score, word_freq
                FROM cooccurrence ORDER BY random() LIMIT 1
            """)
        )
        row = result2.first()
    if row is None:
        raise HTTPException(status_code=404, detail="No cooccurrence data available")
    return CoocPairItem(
        word=row.word,
        partner=row.partner,
        co_count=row.co_count,
        logdice=float(row.logdice),
        mi_score=float(row.mi_score),
        word_freq=row.word_freq,
    )
