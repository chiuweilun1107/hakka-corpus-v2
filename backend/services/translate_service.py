"""Translation service: five-dialect Hakka translation with pinyin."""

from __future__ import annotations

import asyncio
import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from external.hakka_api_client import DIALECT_TABLE, translate
from models.dict import HakkaDict, PinyinIndex
from schemas.ai import DialectResult, TranslateResponse

logger = logging.getLogger(__name__)

# Dialect label → single-char key used in MoeDict pinyin format
_DIALECT_KEY_MAP = {
    "四縣腔": "四",
    "海陸腔": "海",
    "大埔腔": "大",
    "饒平腔": "平",
    "南四縣腔": "南",
}


def _strip_combining(text: str) -> str:
    """Strip U+20DE / U+20DF combining enclosing marks."""
    return text.replace("\u20de", "").replace("\u20df", "")


def _parse_moedict_pinyin(raw_pinyin: str) -> dict[str, str]:
    """Parse MoeDict pinyin format like '四do24 海do53' into {'四': 'do24', ...}."""
    result: dict[str, str] = {}
    parts = re.split(r"\s+", raw_pinyin)
    for p in parts:
        if len(p) >= 2 and p[0] in "四海大平安南":
            result[p[0]] = p[1:].lstrip("\u20de\u20df ")
    return result


async def _lookup_moedict_pinyin(word: str, db: AsyncSession) -> dict[str, str]:
    """Look up MoeDict multi-dialect pinyin from DB.

    Tries whole-word first, then character-by-character concatenation.
    """
    # Whole-word lookup
    stmt = select(HakkaDict).where(HakkaDict.title == word)
    result = await db.execute(stmt)
    entry = result.scalars().first()

    if entry and entry.heteronyms:
        for het in entry.heteronyms:
            rp = het.get("pinyin", "")
            if rp:
                parsed = _parse_moedict_pinyin(_strip_combining(rp))
                if parsed:
                    return parsed

    # Character-by-character fallback
    if len(word) >= 2:
        char_pinyins: list[dict[str, str]] = []
        for ch in word:
            stmt_ch = select(HakkaDict).where(HakkaDict.title == ch)
            r = await db.execute(stmt_ch)
            ce = r.scalars().first()
            if ce and ce.heteronyms:
                found = False
                for h in ce.heteronyms:
                    rp = h.get("pinyin", "")
                    if rp:
                        char_pinyins.append(_parse_moedict_pinyin(_strip_combining(rp)))
                        found = True
                        break
                if not found:
                    char_pinyins.append({})
            else:
                char_pinyins.append({})

        combined: dict[str, str] = {}
        for dk in "四海大平南":
            vals = [cp.get(dk, "") for cp in char_pinyins]
            if all(vals):
                combined[dk] = " ".join(vals)
        return combined

    return {}


async def _translate_single_dialect(
    text: str,
    dialect_info,
    moedict_pinyin: dict[str, str],
    db: AsyncSession,
) -> DialectResult | None:
    """Translate text to a single dialect and resolve pinyin."""
    hakka_text = await translate(text, dialect_info.zh_code)
    if not hakka_text:
        return DialectResult(dialect=dialect_info.label, text="", pinyin="")

    # Get pinyin from API
    pinyin = await translate(hakka_text, dialect_info.py_code)

    # Fallback 1: API pinyin == original text or empty -> use MoeDict
    if not pinyin or pinyin == hakka_text:
        dk = _DIALECT_KEY_MAP.get(dialect_info.label, "")
        pinyin = moedict_pinyin.get(dk, "")

    # Fallback 2: lookup translated result in MoeDict
    if not pinyin or pinyin == hakka_text:
        stmt = select(HakkaDict).where(HakkaDict.title == hakka_text)
        r = await db.execute(stmt)
        te = r.scalars().first()
        if te and te.heteronyms:
            dk = _DIALECT_KEY_MAP.get(dialect_info.label, "")
            for h in te.heteronyms:
                rp = h.get("pinyin", "")
                if rp:
                    parts = re.split(r"\s+", _strip_combining(rp))
                    for pp in parts:
                        if len(pp) >= 2 and pp[0] == dk:
                            pinyin = pp[1:].lstrip("\u20de\u20df ")
                            break
                    break

    # Fallback 3: lookup in pinyin_index table
    if not pinyin or pinyin == hakka_text:
        stmt_pi = (
            select(PinyinIndex)
            .where(
                PinyinIndex.word == hakka_text,
                PinyinIndex.dialect == dialect_info.label.replace("腔", ""),
            )
            .limit(1)
        )
        r_pi = await db.execute(stmt_pi)
        pi_entry = r_pi.scalars().first()
        if pi_entry:
            pinyin = pi_entry.pinyin_full

    return DialectResult(
        dialect=dialect_info.label,
        text=hakka_text,
        pinyin=pinyin or "",
    )


async def translate_all_dialects(text: str, db: AsyncSession) -> TranslateResponse:
    """Translate text into all five Hakka dialects concurrently.

    Returns TranslateResponse with original text and dialect results.
    """
    moedict_pinyin = await _lookup_moedict_pinyin(text, db)

    tasks = [
        _translate_single_dialect(text, info, moedict_pinyin, db)
        for info in DIALECT_TABLE
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    dialects: list[DialectResult] = []
    for r in results:
        if isinstance(r, DialectResult):
            dialects.append(r)
        elif isinstance(r, Exception):
            logger.error("Dialect translation error: %s", r)

    return TranslateResponse(
        original=text,
        dialects=dialects,
        source="客委會翻譯 API + 萌典客語辭典",
    )
