"""Pydantic schemas for cooccurrence endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CoocItem(BaseModel):
    partner: str
    co_count: int
    logdice: float
    mi_score: float
    word_freq: int

    model_config = {"from_attributes": True}


class CoocResponse(BaseModel):
    word: str
    total: int
    sort_by: str
    results: list[CoocItem] = Field(default_factory=list)
