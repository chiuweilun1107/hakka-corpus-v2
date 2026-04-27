"""CoocPositional model — position-based Word Sketch collocates."""

from __future__ import annotations

from sqlalchemy import BigInteger, Column, Integer, Text, UniqueConstraint

from models.base import Base


class CoocPositional(Base):
    __tablename__ = "cooc_positional"

    id = Column(BigInteger, primary_key=True)
    word = Column(Text, nullable=False, index=True)
    partner = Column(Text, nullable=False)
    category = Column(Text, nullable=False)
    count = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("word", "partner", "category", name="uq_cooc_pos"),
    )
