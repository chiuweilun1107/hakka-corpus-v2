"""Pydantic schemas for request/response validation."""

from schemas.dict import DictEntry, DictResponse, DictSearchResult
from schemas.cooc import CoocItem, CoocResponse
from schemas.pinyin import (
    PinyinDialect,
    PinyinRecommendItem,
    PinyinRecommendResponse,
    PinyinSearchItem,
    PinyinSearchResponse,
)
from schemas.stats import StatsOverview

__all__ = [
    "DictEntry",
    "DictResponse",
    "DictSearchResult",
    "CoocItem",
    "CoocResponse",
    "PinyinDialect",
    "PinyinRecommendItem",
    "PinyinRecommendResponse",
    "PinyinSearchItem",
    "PinyinSearchResponse",
    "StatsOverview",
]
