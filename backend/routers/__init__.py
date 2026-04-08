"""API routers -- individual router modules will be added here."""

from routers import dict as dict_router
from routers import cooc as cooc_router
from routers import pinyin as pinyin_router
from routers import stats as stats_router

__all__ = ["dict_router", "cooc_router", "pinyin_router", "stats_router"]
