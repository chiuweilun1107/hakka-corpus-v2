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


class CoocPairItem(BaseModel):
    """用於 /cooc/top 與 /cooc/random-pair，包含 word + partner。"""

    word: str
    partner: str
    co_count: int
    logdice: float
    mi_score: float
    word_freq: int


class SketchCategoryItem(BaseModel):
    partner: str
    count: int


class SketchCategories(BaseModel):
    N_Modifier: list[SketchCategoryItem] = Field(default_factory=list)
    Modifies: list[SketchCategoryItem] = Field(default_factory=list)
    Object_of: list[SketchCategoryItem] = Field(default_factory=list)
    Subject_of: list[SketchCategoryItem] = Field(default_factory=list)
    Possession: list[SketchCategoryItem] = Field(default_factory=list)


class SketchResponse(BaseModel):
    word: str
    categories: SketchCategories


# ── Dialect counts schemas ────────────────────────────────────────────────────

class DialectCountItem(BaseModel):
    dialect: str  # DB label: 四縣/海陸/大埔/饒平/詔安/南四縣
    count: int


class DialectCountsResponse(BaseModel):
    word: str
    counts: list[DialectCountItem] = Field(default_factory=list)
