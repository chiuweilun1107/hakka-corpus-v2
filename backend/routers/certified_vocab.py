"""Certified vocabulary router — lookup and batch endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.certified_vocab import CertifiedVocab
from schemas.certified_vocab import CertifiedVocabBatchItem, CertifiedVocabItem

router = APIRouter(prefix="/api/v1", tags=["certified-vocab"])


@router.get("/certified-vocab/lookup", response_model=CertifiedVocabItem)
async def lookup_certified_vocab(
    word: str = Query(..., description="客語詞"),
    dialect: str | None = Query(None, description="腔調（四縣/海陸/大埔/饒平/詔安）"),
    db: AsyncSession = Depends(get_db),
) -> CertifiedVocabItem:
    """Lookup a single certified vocabulary entry.

    First attempts an exact match on (word, dialect).  If the dialect argument
    is omitted or the dialect-specific record does not exist, falls back to
    returning the first matching entry for the word across any dialect.
    """
    # 1. Try dialect-specific match
    if dialect:
        result = await db.execute(
            select(CertifiedVocab)
            .where(CertifiedVocab.word == word, CertifiedVocab.dialect == dialect)
            .limit(1)
        )
        row = result.scalar_one_or_none()
        if row:
            return CertifiedVocabItem.model_validate(row)

    # 2. Fallback: any dialect
    result = await db.execute(
        select(CertifiedVocab).where(CertifiedVocab.word == word).limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Word not found in certified vocabulary")
    return CertifiedVocabItem.model_validate(row)


@router.get("/certified-vocab/batch", response_model=list[CertifiedVocabBatchItem])
async def batch_certified_vocab(
    words: str = Query(..., description="逗號分隔的客語詞列表，例如：食,飽,無"),
    dialect: str | None = Query(None, description="腔調（四縣/海陸/大埔/饒平/詔安）"),
    db: AsyncSession = Depends(get_db),
) -> list[CertifiedVocabBatchItem]:
    """Batch lookup of certified vocabulary entries.

    For each word in the comma-separated *words* parameter:
    - Returns the first match for the requested dialect (if supplied).
    - Falls back to the first match across any dialect.
    - Returns ``{word, grade: null}`` for words not found in the database.

    Duplicate words in the input are de-duplicated; order is preserved.
    """
    # De-duplicate while preserving order
    seen: set[str] = set()
    word_list: list[str] = []
    for w in words.split(","):
        w = w.strip()
        if w and w not in seen:
            seen.add(w)
            word_list.append(w)

    if not word_list:
        return []

    # Fetch all matching rows for the requested words in one query
    stmt = select(CertifiedVocab).where(CertifiedVocab.word.in_(word_list))
    result = await db.execute(stmt)
    rows = result.scalars().all()

    # Build lookup: word → list of CertifiedVocab rows
    lookup: dict[str, list[CertifiedVocab]] = {}
    for row in rows:
        lookup.setdefault(row.word, []).append(row)

    items: list[CertifiedVocabBatchItem] = []
    for word in word_list:
        candidates = lookup.get(word, [])
        if not candidates:
            items.append(CertifiedVocabBatchItem(word=word, grade=None, mandarin=None))
            continue

        # Prefer dialect-specific match
        chosen: CertifiedVocab | None = None
        if dialect:
            for c in candidates:
                if c.dialect == dialect:
                    chosen = c
                    break
        if chosen is None:
            chosen = candidates[0]

        items.append(
            CertifiedVocabBatchItem(
                word=chosen.word,
                grade=chosen.grade,
                mandarin=chosen.mandarin,
            )
        )

    return items
