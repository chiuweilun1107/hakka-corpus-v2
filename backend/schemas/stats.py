"""Pydantic schemas for stats endpoints."""

from __future__ import annotations

from pydantic import BaseModel


class StatsOverview(BaseModel):
    dict_count: int
    cooc_count: int
    pinyin_count: int
    total_queries_today: int


class DailyQuoteResponse(BaseModel):
    title: str
    pinyin: str
    dialect: str
    definition: str
    example: str


class TrendingItem(BaseModel):
    word: str
    count: int


class TrendingResponse(BaseModel):
    period: str
    items: list[TrendingItem]
