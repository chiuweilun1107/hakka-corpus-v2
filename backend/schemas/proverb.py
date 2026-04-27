"""Pydantic schemas for proverb endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TopicItem(BaseModel):
    name: str
    percentage: int


class ProverbItem(BaseModel):
    id: int
    title: str
    pinyin: str | None = None
    dialect: str | None = None
    definition: str | None = None
    example: str | None = None
    category: str | None = None
    topics: list[TopicItem] | None = None

    model_config = {"from_attributes": True}


class ProverbListResponse(BaseModel):
    total: int
    items: list[ProverbItem] = Field(default_factory=list)
