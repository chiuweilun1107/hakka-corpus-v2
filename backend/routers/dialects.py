"""Dialects router — 5-dialect metadata and representative words."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.dict import PinyinIndex
from schemas.dialect import DialectMeta, DialectWord, DialectWordsResponse

router = APIRouter(prefix="/api/v1", tags=["dialects"])

# 前端 Dialect type 有六種：sixian/hailu/dapu/raoping/zhaoan/sihai
# 後端 pinyin_index.dialect 也是六種：四縣/海陸/大埔/饒平/詔安/南四縣
# 顏色對照（colors.ts）確認 sihai 對應南四縣
_DIALECTS: list[dict] = [
    {"code": "sixian",  "name_zh": "四縣腔", "db_labels": ["四縣"]},
    {"code": "hailu",   "name_zh": "海陸腔", "db_labels": ["海陸"]},
    {"code": "dapu",    "name_zh": "大埔腔", "db_labels": ["大埔"]},
    {"code": "raoping", "name_zh": "饒平腔", "db_labels": ["饒平"]},
    {"code": "zhaoan",  "name_zh": "詔安腔", "db_labels": ["詔安"]},
    {"code": "sihai",   "name_zh": "四海腔", "db_labels": ["南四縣"]},
]

_CODE_MAP: dict[str, dict] = {d["code"]: d for d in _DIALECTS}


@router.get("/dialects", response_model=list[DialectMeta])
async def list_dialects(
    db: AsyncSession = Depends(get_db),
) -> list[DialectMeta]:
    """列出五腔 metadata，含各腔 pinyin_index 筆數。"""
    results = []
    for d in _DIALECTS:
        count_result = await db.execute(
            select(func.count())
            .select_from(PinyinIndex)
            .where(PinyinIndex.dialect.in_(d["db_labels"]))
        )
        total_words = count_result.scalar() or 0
        results.append(
            DialectMeta(
                code=d["code"],
                name_zh=d["name_zh"],
                db_labels=d["db_labels"],
                total_words=total_words,
            )
        )
    return results


@router.get("/dialects/{code}/words", response_model=DialectWordsResponse)
async def dialect_words(
    code: str,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> DialectWordsResponse:
    """查詢某腔調的代表詞，依共現詞頻率排序。"""
    dialect_info = _CODE_MAP.get(code)
    if dialect_info is None:
        valid = list(_CODE_MAP.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dialect code '{code}'. Valid codes: {valid}",
        )

    labels = dialect_info["db_labels"]

    # DISTINCT ON 先去重，外層再依 freq DESC 排序
    rows = await db.execute(
        text("""
            SELECT word, pinyin_full, definition, freq
            FROM (
                SELECT DISTINCT ON (pi.word)
                    pi.word,
                    pi.pinyin_full,
                    pi.definition,
                    COALESCE(c.word_freq, 0) AS freq
                FROM pinyin_index pi
                LEFT JOIN cooccurrence c ON c.word = pi.word
                WHERE pi.dialect = ANY(:labels)
                ORDER BY pi.word, COALESCE(c.word_freq, 0) DESC
            ) sub
            ORDER BY freq DESC
            LIMIT :limit
        """),
        {"labels": labels, "limit": limit},
    )
    items = [
        DialectWord(
            word=r.word,
            pinyin_full=r.pinyin_full,
            definition=r.definition,
            word_freq=r.freq,
        )
        for r in rows.fetchall()
    ]
    return DialectWordsResponse(
        dialect_code=code,
        dialect_name=dialect_info["name_zh"],
        items=items,
    )
