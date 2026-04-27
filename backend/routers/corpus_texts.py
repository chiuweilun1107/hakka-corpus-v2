"""Corpus texts router — 文章級客語語料 + AI 分析結果（主題/摘要/NER/情感）"""

from __future__ import annotations

import json as _json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import cast, select, func, or_, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.corpus_text import CorpusText

router = APIRouter(prefix="/api/v1/corpus", tags=["corpus-texts"])


class CorpusTextSummary(BaseModel):
    """列表用（不含全文）"""
    id: str
    title: str
    dialect: str | None = None
    genre: str | None = None
    source: str | None = None
    word_count: int | None = None
    summary: str | None = None
    topics: list | None = None
    categories: list | None = None
    sentiment: dict | None = None

    class Config:
        from_attributes = True


class CorpusTextDetail(BaseModel):
    """詳細頁用（含全文 + 所有 AI 分析）"""
    id: str
    title: str
    content: str
    content_pinyin: str | None = None
    dialect: str | None = None
    genre: str | None = None
    author: str | None = None
    source: str | None = None
    source_url: str | None = None
    license: str | None = None
    year: int | None = None
    word_count: int | None = None
    categories: list | None = None

    # AI 分析
    summary: str | None = None
    summary_pinyin: str | None = None
    summary_zh: str | None = None
    topics: list | None = None
    ner_entities: dict | None = None
    sentiment: dict | None = None

    class Config:
        from_attributes = True


class CorpusTextListResponse(BaseModel):
    total: int
    items: list[CorpusTextSummary]
    offset: int
    limit: int


@router.get("/texts", response_model=CorpusTextListResponse)
async def list_texts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    dialect: str | None = Query(None, description="四縣/海陸/大埔/饒平/詔安/南四縣"),
    genre: str | None = Query(None, description="散文/口述/歌謠/新聞/諺語集/百科"),
    topic: str | None = Query(None, description="主題過濾（飲食/產業/生活/人物/地理/民俗/節慶/文化/歌謠/教育/觀光/歷史）"),
    q: str | None = Query(None, description="標題或內容關鍵字搜尋"),
    db: AsyncSession = Depends(get_db),
):
    """列出語料文本（含篩選）"""
    stmt = select(CorpusText)
    if dialect:
        stmt = stmt.where(CorpusText.dialect == dialect)
    if genre:
        stmt = stmt.where(CorpusText.genre == genre)
    if topic:
        stmt = stmt.where(
            text("topics @> CAST(:t AS jsonb)").bindparams(
                t=_json.dumps([{"name": topic}], ensure_ascii=False)
            )
        )
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(CorpusText.title.ilike(pattern), CorpusText.content.ilike(pattern)))

    # Count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # Page
    stmt = stmt.order_by(CorpusText.id).offset(offset).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    items = [CorpusTextSummary.model_validate(r) for r in rows]
    return CorpusTextListResponse(total=total, items=items, offset=offset, limit=limit)


@router.get("/texts/{text_id}", response_model=CorpusTextDetail)
async def get_text(
    text_id: str,
    db: AsyncSession = Depends(get_db),
):
    """取得單篇語料文本（含完整 AI 分析）"""
    stmt = select(CorpusText).where(CorpusText.id == text_id)
    result = await db.execute(stmt)
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail=f"Corpus text not found: {text_id}")
    return CorpusTextDetail.model_validate(row)


@router.get("/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    """語料庫統計：總數 + 各文類/腔調分布"""
    total = (await db.execute(select(func.count(CorpusText.id)))).scalar_one()

    genre_stmt = select(CorpusText.genre, func.count()).group_by(CorpusText.genre)
    genres = [{"genre": r[0] or "未分類", "count": r[1]} for r in (await db.execute(genre_stmt)).all()]

    dialect_stmt = select(CorpusText.dialect, func.count()).group_by(CorpusText.dialect)
    dialects = [{"dialect": r[0] or "未分類", "count": r[1]} for r in (await db.execute(dialect_stmt)).all()]

    analyzed = (await db.execute(
        select(func.count(CorpusText.id)).where(CorpusText.analysis_updated_at.isnot(None))
    )).scalar_one()

    return {
        "total": total,
        "analyzed": analyzed,
        "by_genre": genres,
        "by_dialect": dialects,
    }
