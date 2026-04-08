"""User model."""

from __future__ import annotations

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    Text,
    func,
)

from models.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(Text, nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False, default="user")     # user / admin
    display_name = Column(Text)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
