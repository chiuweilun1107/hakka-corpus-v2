"""Cooccurrence model."""

from __future__ import annotations

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)

from models.base import Base


class Cooccurrence(Base):
    __tablename__ = "cooccurrence"

    id = Column(Integer, primary_key=True)
    word = Column(Text, nullable=False, index=True)
    partner = Column(Text, nullable=False)
    co_count = Column(Integer, nullable=False, default=0)
    word_freq = Column(Integer, nullable=False, default=0)
    logdice = Column(Numeric(8, 4), nullable=False, default=0)
    mi_score = Column(Numeric(10, 4), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("word", "partner", name="uq_cooc_word_partner"),
    )
