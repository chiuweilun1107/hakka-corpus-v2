"""Pydantic schemas for certified_vocab endpoints."""

from __future__ import annotations

from pydantic import BaseModel


class CertifiedVocabItem(BaseModel):
    word: str
    pinyin: str | None = None
    dialect: str | None = None
    grade: str
    category: str | None = None
    mandarin: str | None = None

    model_config = {"from_attributes": True}


class CertifiedVocabBatchItem(BaseModel):
    word: str
    grade: str | None = None   # None if not found in certified_vocab
    mandarin: str | None = None
