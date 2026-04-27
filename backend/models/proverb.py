"""DailyProverb ORM model — formalises the undocumented daily_proverbs table."""

from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB

from models.base import Base


class DailyProverb(Base):
    __tablename__ = "daily_proverbs"

    id = Column(Integer, primary_key=True)
    title = Column(Text, nullable=False)
    pinyin = Column(Text)
    dialect = Column(Text)
    definition = Column(Text)
    example = Column(Text)
    category = Column(Text)
    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    topics = Column(JSONB)
