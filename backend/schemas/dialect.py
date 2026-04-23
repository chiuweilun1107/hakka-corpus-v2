"""Pydantic schemas for dialect endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DialectMeta(BaseModel):
    code: str
    name_zh: str
    db_labels: list[str]
    total_words: int


class DialectWord(BaseModel):
    word: str
    pinyin_full: str
    definition: str | None = None
    word_freq: int


class DialectWordsResponse(BaseModel):
    dialect_code: str
    dialect_name: str
    items: list[DialectWord] = Field(default_factory=list)
