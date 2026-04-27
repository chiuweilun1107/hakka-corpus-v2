"""Cooccurrence query router."""

from __future__ import annotations

import time
from enum import Enum

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cooc import Cooccurrence
from models.cooc_dialect import CoocDialect
from models.cooc_positional import CoocPositional
from models.log import QueryLog
from schemas.cooc import (
    CoocItem,
    CoocPairItem,
    CoocResponse,
    DialectCountItem,
    DialectCountsResponse,
    SketchCategories,
    SketchCategoryItem,
    SketchResponse,
)

router = APIRouter(prefix="/api/v1", tags=["cooc"])

# dialect code (URL param) → DB label 對照表
_DIALECT_CODE_MAP: dict[str, str] = {
    "sixian": "四縣",
    "hailu": "海陸",
    "dapu": "大埔",
    "raoping": "饒平",
    "zhaoan": "詔安",
    "sihai": "南四縣",
}


class SortField(str, Enum):
    logdice = "logdice"
    mi = "mi"
    freq = "freq"
    word_freq = "word_freq"


_SORT_MAP = {
    SortField.logdice: Cooccurrence.logdice.desc(),
    SortField.mi: Cooccurrence.mi_score.desc(),
    SortField.freq: Cooccurrence.co_count.desc(),
    SortField.word_freq: Cooccurrence.word_freq.desc(),
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


@router.get("/cooc/positional", response_model=CoocResponse)
async def cooc_positional(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    cats: str = Query(
        None,
        description="逗號分隔的語法類別，可選 N_Modifier/Modifies/Object_of/Subject_of/Possession，預設全部",
    ),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> CoocResponse:
    """
    位置型共現詞查詢：查 cooc_positional 表，依語法類別篩選，
    LEFT JOIN cooccurrence 取 logdice/mi_score/word_freq。
    """
    start = time.perf_counter()

    _VALID_CATS = {"N_Modifier", "Modifies", "Object_of", "Subject_of", "Possession"}

    # 解析 cats 參數
    if cats:
        requested = {c.strip() for c in cats.split(",") if c.strip()}
        invalid = requested - _VALID_CATS
        if invalid:
            raise HTTPException(
                status_code=422,
                detail=f"無效的類別: {', '.join(sorted(invalid))}。有效值: {', '.join(sorted(_VALID_CATS))}",
            )
        cat_list = list(requested)
    else:
        cat_list = list(_VALID_CATS)

    # total count（不含 offset/limit）
    count_stmt = (
        select(func.count())
        .select_from(CoocPositional)
        .where(
            CoocPositional.word == q,
            CoocPositional.category.in_(cat_list),
        )
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # 取分頁資料
    pos_stmt = (
        select(CoocPositional)
        .where(
            CoocPositional.word == q,
            CoocPositional.category.in_(cat_list),
        )
        .order_by(CoocPositional.count.desc())
        .offset(offset)
        .limit(limit)
    )
    pos_result = await db.execute(pos_stmt)
    pos_rows = pos_result.scalars().all()

    if not pos_rows:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        bg.add_task(_log_query, db, q, "cooc_positional", 0, elapsed_ms)
        return CoocResponse(word=q, total=total, sort_by="count", results=[])

    # 批次取對應的 cooccurrence 補充資訊（logdice, mi_score, word_freq）
    partner_list = [row.partner for row in pos_rows]
    cooc_stmt = (
        select(Cooccurrence)
        .where(
            Cooccurrence.word == q,
            Cooccurrence.partner.in_(partner_list),
        )
    )
    cooc_result = await db.execute(cooc_stmt)
    cooc_map: dict[str, Cooccurrence] = {row.partner: row for row in cooc_result.scalars().all()}

    items = []
    for row in pos_rows:
        cooc_row = cooc_map.get(row.partner)
        items.append(
            CoocItem(
                partner=row.partner,
                co_count=row.count,
                logdice=float(cooc_row.logdice) if cooc_row else 0.0,
                mi_score=float(cooc_row.mi_score) if cooc_row else 0.0,
                word_freq=cooc_row.word_freq if cooc_row else 0,
            )
        )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    bg.add_task(_log_query, db, q, "cooc_positional", len(items), elapsed_ms)

    return CoocResponse(word=q, total=total, sort_by="count", results=items)


@router.get("/cooc/dialect-counts", response_model=DialectCountsResponse)
async def cooc_dialect_counts(
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    db: AsyncSession = Depends(get_db),
) -> DialectCountsResponse:
    """
    腔調分布查詢：統計某詞在 cooc_dialect 表各腔調的 partner 數量。
    """
    stmt = (
        select(CoocDialect.dialect, func.count(CoocDialect.partner.distinct()).label("count"))
        .where(CoocDialect.word == q)
        .group_by(CoocDialect.dialect)
        .order_by(func.count(CoocDialect.partner.distinct()).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    counts = [DialectCountItem(dialect=row.dialect, count=row.count) for row in rows]
    return DialectCountsResponse(word=q, counts=counts)


@router.get("/cooc", response_model=CoocResponse)
async def query_cooccurrence(
    bg: BackgroundTasks,
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    sort: SortField = Query(SortField.logdice, description="排序方式"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    dialects: str = Query(
        None,
        description="逗號分隔的腔調代碼篩選，可選 sixian/hailu/dapu/raoping/zhaoan/sihai",
    ),
    db: AsyncSession = Depends(get_db),
) -> CoocResponse:
    """
    共現詞查詢：查 cooccurrence 表，word = q，支援三種排序。
    若精確查不到，改用 LIKE 模糊查。
    可選 dialects 參數，僅回傳指定腔調中出現的 partner。
    """
    start = time.perf_counter()

    order_clause = _SORT_MAP[sort]

    # 解析 dialects 參數，轉換為 DB label
    dialect_labels: list[str] | None = None
    if dialects:
        codes = [c.strip() for c in dialects.split(",") if c.strip()]
        dialect_labels = []
        for code in codes:
            label = _DIALECT_CODE_MAP.get(code)
            if label is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"無效的腔調代碼: {code}。有效值: {', '.join(_DIALECT_CODE_MAP.keys())}",
                )
            dialect_labels.append(label)

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
        base_where_fuzzy = [Cooccurrence.word.like(like_pattern)]
        if dialect_labels:
            dialect_subq = (
                select(CoocDialect.partner.distinct())
                .where(
                    CoocDialect.word.like(like_pattern),
                    CoocDialect.dialect.in_(dialect_labels),
                )
                .scalar_subquery()
            )
            base_where_fuzzy.append(Cooccurrence.partner.in_(dialect_subq))

        count_stmt_fuzzy = (
            select(func.count())
            .select_from(Cooccurrence)
            .where(*base_where_fuzzy)
        )
        total_result = await db.execute(count_stmt_fuzzy)
        total = total_result.scalar() or 0

        stmt = (
            select(Cooccurrence)
            .where(*base_where_fuzzy)
            .order_by(order_clause)
            .offset(offset)
            .limit(limit)
        )
    else:
        base_where_exact = [Cooccurrence.word == q]
        if dialect_labels:
            dialect_subq = (
                select(CoocDialect.partner.distinct())
                .where(
                    CoocDialect.word == q,
                    CoocDialect.dialect.in_(dialect_labels),
                )
                .scalar_subquery()
            )
            base_where_exact.append(Cooccurrence.partner.in_(dialect_subq))

        count_stmt_exact = (
            select(func.count())
            .select_from(Cooccurrence)
            .where(*base_where_exact)
        )
        total_result = await db.execute(count_stmt_exact)
        total = total_result.scalar() or 0

        stmt = (
            select(Cooccurrence)
            .where(*base_where_exact)
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


@router.get("/cooc/sketch", response_model=SketchResponse)
async def cooc_sketch(
    q: str = Query(..., min_length=1, max_length=100, description="查詢詞"),
    limit_per_cat: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> SketchResponse:
    """
    位置型 Word Sketch：依左/右相對位置將共現詞分入 5 個語法欄位。
    資料由 build_positional_cooc.py 預先計算寫入 cooc_positional 表。
    """
    stmt = (
        select(CoocPositional.category, CoocPositional.partner, CoocPositional.count)
        .where(CoocPositional.word == q)
        .order_by(CoocPositional.count.desc())
    )
    rows = (await db.execute(stmt)).all()

    buckets: dict[str, list[SketchCategoryItem]] = {
        "N_Modifier": [],
        "Modifies": [],
        "Object_of": [],
        "Subject_of": [],
        "Possession": [],
    }
    counts: dict[str, int] = {k: 0 for k in buckets}
    for row in rows:
        cat = row.category
        if cat not in buckets:
            continue
        if counts[cat] < limit_per_cat:
            buckets[cat].append(SketchCategoryItem(partner=row.partner, count=row.count))
            counts[cat] += 1

    return SketchResponse(
        word=q,
        categories=SketchCategories(**buckets),
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
