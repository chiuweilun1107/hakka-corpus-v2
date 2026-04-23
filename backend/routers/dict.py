"""Dictionary lookup router."""

from __future__ import annotations

import hashlib
import time
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import and_, exists, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cooc import Cooccurrence
from models.dict import HakkaDict, PinyinIndex
from models.log import QueryLog
from schemas.dict import (
    CoocWord,
    DictEntry,
    DictResponse,
    DictSearchResult,
    PinyinByDialect,
    ProverbPreview,
    WordOfDayResponse,
)

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


_DIALECT_LABELS: dict[str, list[str]] = {
    "sixian":  ["四縣"],
    "hailu":   ["海陸"],
    "dapu":    ["大埔"],
    "raoping": ["饒平"],
    "zhaoan":  ["詔安"],
    "sihai":   ["南四縣"],
}


@router.get("/dict/random", response_model=DictEntry)
async def random_dict(
    dialect: str | None = Query(None, description="腔調代碼（sixian/hailu/dapu/raoping/zhaoan）"),
    db: AsyncSession = Depends(get_db),
) -> DictEntry:
    """隨機取一條辭典詞，可選腔調過濾。"""
    if dialect:
        labels = _DIALECT_LABELS.get(dialect)
        if labels is None:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid dialect code. Valid: {list(_DIALECT_LABELS.keys())}",
            )
        result = await db.execute(
            text("""
                SELECT h.id, h.title, h.heteronyms
                FROM hakka_dict h
                WHERE EXISTS (
                    SELECT 1 FROM pinyin_index pi
                    WHERE pi.dict_id = h.id AND pi.dialect = ANY(:labels)
                )
                ORDER BY random()
                LIMIT 1
            """),
            {"labels": labels},
        )
    else:
        result = await db.execute(
            text("SELECT id, title, heteronyms FROM hakka_dict ORDER BY random() LIMIT 1")
        )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="No dictionary entries found")
    return DictEntry(id=row.id, title=row.title, heteronyms=row.heteronyms or [])


@router.get("/dict/word-of-day", response_model=WordOfDayResponse)
async def word_of_day(
    q: str | None = Query(None, description="關鍵字搜尋（節慶連動）；省略時用當日 seed"),
    random: bool = Query(False, description="隨機選一個有完整拼音的詞（供「換一個」使用）"),
    db: AsyncSession = Depends(get_db),
) -> WordOfDayResponse:
    """每日主題詞：依當日日期 seed 穩定選詞，聚合六腔拼音 + 共現詞 + 相關諺語。
    傳入 q= 時改為 LIKE 搜標題（節慶連動用）；random=true 時隨機選詞。
    三種模式都保證選到的詞有至少一筆 pinyin_index 紀錄。
    """
    # 合格主題詞：有拼音 + 長度 2-4 字 + 非歇後語（排除 －－/-- 符號）
    # 排除單字：單字語意寬泛，LIKE 搜相關諺語會撈到偽相關（例：「先」會匹配到「先人」「先說」等）
    eligible = and_(
        exists(
            select(PinyinIndex.dict_id).where(PinyinIndex.dict_id == HakkaDict.id)
        ),
        func.char_length(HakkaDict.title).between(2, 4),
        ~HakkaDict.title.like('%－－%'),
        ~HakkaDict.title.like('%--%'),
    )

    entry_row = None

    # 1. keyword 搜尋（節慶連動）：在合格池內 LIKE 搜；可與 random 共存
    if q:
        stmt = select(HakkaDict).where(eligible, HakkaDict.title.like(f"%{q}%"))
        if random:
            stmt = stmt.order_by(func.random()).limit(1)
        else:
            stmt = stmt.limit(1)
        entry_row = (await db.execute(stmt)).scalars().first()

    # 2. 純 random（非節慶 context 的「換一個」）
    if entry_row is None and random:
        stmt = (
            select(HakkaDict)
            .where(eligible)
            .order_by(func.random())
            .limit(1)
        )
        entry_row = (await db.execute(stmt)).scalars().first()

    # 3. 每日 seed fallback
    if entry_row is None:
        seed_hex = hashlib.md5(date.today().isoformat().encode()).hexdigest()
        seed = int(seed_hex, 16)
        count_result = await db.execute(
            select(func.count()).select_from(HakkaDict).where(eligible)
        )
        total = count_result.scalar() or 1
        offset = seed % total
        stmt = (
            select(HakkaDict)
            .where(eligible)
            .order_by(HakkaDict.id)
            .offset(offset)
            .limit(1)
        )
        entry_row = (await db.execute(stmt)).scalars().first()

    if entry_row is None:
        raise HTTPException(status_code=404, detail="Dictionary is empty")

    # 五腔拼音
    pinyin_result = await db.execute(
        select(PinyinIndex.dialect, PinyinIndex.pinyin_full)
        .where(PinyinIndex.dict_id == entry_row.id)
    )
    pinyin_by_dialect = [
        PinyinByDialect(dialect=r.dialect, pinyin_full=r.pinyin_full)
        for r in pinyin_result.fetchall()
    ]

    # 共現詞 top 8（logDice 排序）
    cooc_result = await db.execute(
        select(Cooccurrence.partner, Cooccurrence.logdice)
        .where(Cooccurrence.word == entry_row.title)
        .order_by(Cooccurrence.logdice.desc())
        .limit(8)
    )
    cooc_words = [
        CoocWord(partner=r.partner, logdice=float(r.logdice))
        for r in cooc_result.fetchall()
    ]

    # 相關諺語（0-2 筆）：諺語原文（title）必須含主題詞才算相關
    # 不看 definition — 解釋裡提到該字不代表諺語本身是講這個主題
    proverb_result = await db.execute(
        text("""
            SELECT title, pinyin, definition, example FROM daily_proverbs
            WHERE is_active = true
              AND title != :word
              AND title LIKE :pattern
            LIMIT 2
        """),
        {"word": entry_row.title, "pattern": f"%{entry_row.title}%"},
    )
    related_proverbs = [
        ProverbPreview(
            title=r.title,
            pinyin=r.pinyin,
            definition=r.definition,
            example=r.example,
        )
        for r in proverb_result.fetchall()
    ]

    return WordOfDayResponse(
        entry=DictEntry(
            id=entry_row.id,
            title=entry_row.title,
            heteronyms=entry_row.heteronyms or [],
        ),
        pinyin_by_dialect=pinyin_by_dialect,
        cooc_words=cooc_words,
        related_proverbs=related_proverbs,
    )


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
