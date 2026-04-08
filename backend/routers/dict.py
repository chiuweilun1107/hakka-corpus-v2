"""Dictionary lookup router."""

from __future__ import annotations

import time

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.dict import HakkaDict, PinyinIndex
from models.log import QueryLog
from schemas.dict import DictEntry, DictResponse, DictSearchResult

router = APIRouter(prefix="/api/v1", tags=["dict"])


async def _log_query(
    db: AsyncSession,
    query_text: str,
    query_type: str,
    result_count: int,
    response_ms: int,
) -> None:
    """Insert a query log record."""
    log = QueryLog(
        query_text=query_text,
        query_type=query_type,
        result_count=result_count,
        response_ms=response_ms,
    )
    db.add(log)
    await db.commit()


@router.get("/dict", response_model=DictResponse)
async def lookup_dict(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    db: AsyncSession = Depends(get_db),
) -> DictResponse:
    """
    辭典查詢：先精確查 hakka_dict.title，查不到再模糊 LIKE。
    """
    start = time.perf_counter()

    # 1. 精確查詢
    stmt = select(HakkaDict).where(HakkaDict.title == q)
    result = await db.execute(stmt)
    entry_row = result.scalars().first()

    related: list[DictSearchResult] = []

    if entry_row is None:
        # 2. 模糊查 LIKE
        like_pattern = f"%{q}%"
        stmt_like = (
            select(HakkaDict)
            .where(HakkaDict.title.like(like_pattern))
            .limit(20)
        )
        result_like = await db.execute(stmt_like)
        rows = result_like.scalars().all()

        for row in rows:
            pinyin_preview = _extract_pinyin_preview(row.heteronyms)
            def_preview = _extract_definition_preview(row.heteronyms)
            related.append(
                DictSearchResult(
                    title=row.title,
                    pinyin_preview=pinyin_preview,
                    definition_preview=def_preview,
                )
            )

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        bg.add_task(_log_query, db, q, "dict", len(related), elapsed_ms)
        return DictResponse(entry=None, related=related)

    # 精確命中 — 同時查相關詞
    entry = DictEntry(
        id=entry_row.id,
        title=entry_row.title,
        heteronyms=entry_row.heteronyms or [],
    )

    like_pattern = f"%{q}%"
    stmt_related = (
        select(HakkaDict)
        .where(HakkaDict.title.like(like_pattern), HakkaDict.id != entry_row.id)
        .limit(10)
    )
    result_related = await db.execute(stmt_related)
    for row in result_related.scalars().all():
        pinyin_preview = _extract_pinyin_preview(row.heteronyms)
        def_preview = _extract_definition_preview(row.heteronyms)
        related.append(
            DictSearchResult(
                title=row.title,
                pinyin_preview=pinyin_preview,
                definition_preview=def_preview,
            )
        )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "dict", 1 + len(related), elapsed_ms)
    return DictResponse(entry=entry, related=related)


@router.get("/dict/search", response_model=list[DictSearchResult])
async def search_dict(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="搜尋關鍵字"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[DictSearchResult]:
    """
    模糊搜索辭典（LIKE）。
    """
    start = time.perf_counter()

    like_pattern = f"%{q}%"
    stmt = (
        select(HakkaDict)
        .where(HakkaDict.title.like(like_pattern))
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    items: list[DictSearchResult] = []
    for row in rows:
        pinyin_preview = _extract_pinyin_preview(row.heteronyms)
        def_preview = _extract_definition_preview(row.heteronyms)
        items.append(
            DictSearchResult(
                title=row.title,
                pinyin_preview=pinyin_preview,
                definition_preview=def_preview,
            )
        )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "dict_search", len(items), elapsed_ms)
    return items


# ── Helpers ──────────────────────────────────────────────


def _extract_pinyin_preview(heteronyms: list | None) -> str | None:
    """Return the first pinyin string from heteronyms JSONB."""
    if not heteronyms:
        return None
    for h in heteronyms:
        if isinstance(h, dict):
            # Try common keys
            for key in ("pinyin", "bopomofo", "trs"):
                val = h.get(key)
                if val:
                    return str(val)
    return None


def _extract_definition_preview(heteronyms: list | None) -> str | None:
    """Return the first definition snippet from heteronyms JSONB."""
    if not heteronyms:
        return None
    for h in heteronyms:
        if isinstance(h, dict):
            defs = h.get("definitions") or h.get("def")
            if isinstance(defs, list) and defs:
                first_def = defs[0]
                if isinstance(first_def, dict):
                    d = first_def.get("def") or first_def.get("definition") or ""
                    return str(d)[:120] if d else None
                return str(first_def)[:120]
            elif isinstance(defs, str):
                return defs[:120]
    return None
