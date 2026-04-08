"""Pydantic schemas for pinyin endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PinyinDialect(BaseModel):
    dialect: str
    pinyin_full: str
    pinyin_base: str


class PinyinRecommendItem(BaseModel):
    word: str
    dialects: list[PinyinDialect] = Field(default_factory=list)


class PinyinRecommendResponse(BaseModel):
    query: str
    items: list[PinyinRecommendItem] = Field(default_factory=list)


class PinyinSearchItem(BaseModel):
    word: str
    pinyin_full: str
    pinyin_base: str
    dialect: str
    definition: str | None = None

    model_config = {"from_attributes": True}


class PinyinSearchResponse(BaseModel):
    query: str
    results: list[PinyinSearchItem] = Field(default_factory=list)
