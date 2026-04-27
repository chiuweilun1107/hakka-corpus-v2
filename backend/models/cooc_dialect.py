"""CoocDialect model — dialect-segmented cooccurrence counts."""

from __future__ import annotations

from sqlalchemy import BigInteger, Column, Integer, String, Text, UniqueConstraint

from models.base import Base


class CoocDialect(Base):
    __tablename__ = "cooc_dialect"

    id = Column(BigInteger, primary_key=True)
    word = Column(Text, nullable=False, index=True)
    partner = Column(Text, nullable=False)
    dialect = Column(String(20), nullable=False, index=True)  # 四縣/海陸/大埔/饒平/詔安/南四縣
    co_count = Column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("word", "partner", "dialect", name="uq_cooc_dialect"),
    )
