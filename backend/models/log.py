"""Query log and chat history models."""

from __future__ import annotations

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from models.base import Base


class QueryLog(Base):
    __tablename__ = "query_log"

    id = Column(Integer, primary_key=True)
    query_text = Column(Text, nullable=False)
    query_type = Column(Text, nullable=False)           # dict / cooc / chat
    dialect = Column(Text)
    result_count = Column(Integer, default=0)
    response_ms = Column(Integer, default=0)
    ip_hash = Column(Text)
    session_id = Column(Text, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True)
    session_id = Column(Text, nullable=False, index=True)
    role = Column(Text, nullable=False)                 # user / assistant / system
    content = Column(Text, nullable=False)
    mode = Column(Text)                                 # explain / translate / chat
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
