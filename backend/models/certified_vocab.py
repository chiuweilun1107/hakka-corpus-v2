"""SQLAlchemy ORM model for the certified_vocab table."""

from __future__ import annotations

from sqlalchemy import Column, DateTime, Integer, Text, func

from models.base import Base


class CertifiedVocab(Base):
    __tablename__ = "certified_vocab"

    id = Column(Integer, primary_key=True)
    word = Column(Text, nullable=False)
    pinyin = Column(Text)
    dialect = Column(Text)
    grade = Column(Text, nullable=False)
    category = Column(Text)
    mandarin = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
