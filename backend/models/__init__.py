"""SQLAlchemy models -- all models imported here for Alembic discovery."""

from models.base import Base
from models.dict import HakkaDict, PinyinIndex
from models.cooc import Cooccurrence
from models.log import QueryLog, ChatHistory
from models.proverb import DailyProverb
from models.user import User

__all__ = [
    "Base",
    "HakkaDict",
    "PinyinIndex",
    "Cooccurrence",
    "QueryLog",
    "ChatHistory",
    "DailyProverb",
    "User",
]
