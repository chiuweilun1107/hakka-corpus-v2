"""Pinyin lookup and recommendation router."""

from __future__ import annotations

import time
from collections import defaultdict

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.dict import PinyinIndex
from models.log import QueryLog
from schemas.pinyin import (
    PinyinDialect,
    PinyinRecommendItem,
    PinyinRecommendResponse,
    PinyinSearchItem,
    PinyinSearchResponse,
)

router = APIRouter(prefix="/api/v1", tags=["pinyin"])


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


@router.get("/pinyin/recommend", response_model=PinyinRecommendResponse)
async def pinyin_recommend(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=200, description="漢字文字"),
    db: AsyncSession = Depends(get_db),
) -> PinyinRecommendResponse:
    """
    漢字 -> 五腔拼音推薦。
    1. 先精確查 pinyin_index WHERE word = q（整段查）
    2. 然後逐字拆查（q 的每個字分別查 pinyin_index）
    3. 按 dialect 分組回傳
    """
    start = time.perf_counter()

    items: list[PinyinRecommendItem] = []

    # 1. 完整詞查詢
    stmt_full = select(PinyinIndex).where(PinyinIndex.word == q)
    result_full = await db.execute(stmt_full)
    rows_full = result_full.scalars().all()

    if rows_full:
        dialects = [
            PinyinDialect(
                dialect=r.dialect,
                pinyin_full=r.pinyin_full,
                pinyin_base=r.pinyin_base,
            )
            for r in rows_full
        ]
        items.append(PinyinRecommendItem(word=q, dialects=dialects))

    # 2. 逐字拆查
    chars = list(q)
    for ch in chars:
        if len(ch.strip()) == 0:
            continue
        stmt_ch = select(PinyinIndex).where(PinyinIndex.word == ch)
        result_ch = await db.execute(stmt_ch)
        rows_ch = result_ch.scalars().all()

        if rows_ch:
            # 去重：同一個 dialect 可能有多筆，保留所有
            dialects = [
                PinyinDialect(
                    dialect=r.dialect,
                    pinyin_full=r.pinyin_full,
                    pinyin_base=r.pinyin_base,
                )
                for r in rows_ch
            ]
            items.append(PinyinRecommendItem(word=ch, dialects=dialects))

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "pinyin_recommend", len(items), elapsed_ms)

    return PinyinRecommendResponse(query=q, items=items)


@router.get("/pinyin", response_model=PinyinSearchResponse)
async def pinyin_search(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="拼音"),
    dialect: str | None = Query(None, description="腔調篩選"),
    limit: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PinyinSearchResponse:
    """
    拼音反查 + 自動補全。
    WHERE pinyin_base LIKE '{q}%'，可選篩選 dialect。
    """
    start = time.perf_counter()

    like_pattern = f"{q}%"
    stmt = select(PinyinIndex).where(PinyinIndex.pinyin_base.like(like_pattern))

    if dialect:
        stmt = stmt.where(PinyinIndex.dialect == dialect)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    results = [
        PinyinSearchItem(
            word=r.word,
            pinyin_full=r.pinyin_full,
            pinyin_base=r.pinyin_base,
            dialect=r.dialect,
            definition=r.definition,
        )
        for r in rows
    ]

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "pinyin_search", len(results), elapsed_ms)

    return PinyinSearchResponse(query=q, results=results)
