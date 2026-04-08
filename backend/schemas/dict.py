"""Pydantic schemas for dictionary endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DictEntry(BaseModel):
    id: int
    title: str
    heteronyms: list[Any] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class DictSearchResult(BaseModel):
    title: str
    pinyin_preview: str | None = None
    definition_preview: str | None = None


class DictResponse(BaseModel):
    entry: DictEntry | None = None
    related: list[DictSearchResult] = Field(default_factory=list)
