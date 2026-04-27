"""SQLAlchemy models -- all models imported here for Alembic discovery."""

from models.base import Base
from models.dict import HakkaDict, PinyinIndex
from models.cooc import Cooccurrence
from models.cooc_dialect import CoocDialect
from models.log import QueryLog, ChatHistory
from models.proverb import DailyProverb
from models.user import User

__all__ = [
    "Base",
    "HakkaDict",
    "PinyinIndex",
    "Cooccurrence",
    "CoocDialect",
    "QueryLog",
    "ChatHistory",
    "DailyProverb",
    "User",
]
