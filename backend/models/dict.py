"""Hakka dictionary and pinyin index models."""

from __future__ import annotations

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from models.base import Base


class HakkaDict(Base):
    __tablename__ = "hakka_dict"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False, index=True)
    heteronyms = Column(JSONB, nullable=False, default=list)
    raw_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class PinyinIndex(Base):
    __tablename__ = "pinyin_index"

    id = Column(Integer, primary_key=True)
    dict_id = Column(Integer, ForeignKey("hakka_dict.id"), nullable=False)
    word = Column(Text, nullable=False, index=True)
    pinyin_full = Column(Text, nullable=False)       # with tone numbers
    pinyin_base = Column(Text, nullable=False, index=True)  # tone numbers stripped
    dialect = Column(Text, nullable=False)            # 四縣/海陸/大埔/饒平/詔安/南四縣
    definition = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
