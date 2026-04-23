"""Corpus texts model — article-level Hakka text for AI analysis (topic/summary/NER/sentiment)."""

from __future__ import annotations

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from models.base import Base


class CorpusText(Base):
    __tablename__ = "corpus_texts"

    id = Column(String(100), primary_key=True)       # e.g. "wiki_7198" / "proverb_theme_..."
    title = Column(Text, nullable=False, index=True)
    content = Column(Text, nullable=False)
    content_pinyin = Column(Text)
    dialect = Column(String(20), index=True)          # 四縣 / 海陸 / 大埔 / 饒平 / 詔安 / 南四縣
    genre = Column(String(30), index=True)            # 散文 / 口述 / 歌謠 / 新聞 / 諺語集 / 百科
    author = Column(Text)
    source = Column(Text)
    source_url = Column(Text)
    license = Column(String(50))
    year = Column(Integer)
    word_count = Column(Integer)
    categories = Column(JSONB)                         # array of strings

    # AI 分析結果
    summary = Column(Text)                             # 自動摘要（客語）
    summary_pinyin = Column(Text)
    summary_zh = Column(Text)                          # 對應華語
    topics = Column(JSONB)                             # [{name, percentage, keywords:[]}]
    ner_entities = Column(JSONB)                       # {persons:[], places:[], orgs:[]}
    sentiment = Column(JSONB)                          # {positive:0.52, negative:0.15, neutral:0.33}
    analysis_updated_at = Column(DateTime(timezone=True))

    metadata_ = Column("metadata", JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
