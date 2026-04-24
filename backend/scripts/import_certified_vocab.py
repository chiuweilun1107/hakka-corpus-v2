#!/usr/bin/env python3
"""Import 客委會 certified vocabulary from government open data API.

Source: https://cloud.hakka.gov.tw/Pub/Opendata/DTST20161300024.json

The API returns malformed JSON (unescaped double-quotes inside english_ridigned
values) and some accent/kind fields contain garbled '?' characters.  Both issues
are handled transparently before inserting into the database.

Usage:
    python scripts/import_certified_vocab.py
"""

from __future__ import annotations

import asyncio
import json
import re
import time
import warnings

import asyncpg
import requests

DSN = "postgresql://postgres:postgres@localhost:54322/postgres"
DATA_URL = "https://cloud.hakka.gov.tw/Pub/Opendata/DTST20161300024.json"
BATCH_SIZE = 500

# ── Known clean accent labels ──────────────────────────────────────────────────
VALID_ACCENTS = {"四縣", "海陸", "大埔", "饒平", "詔安", "南四縣"}

# ── Grade fallback based on category keywords ─────────────────────────────────
GRADE_KEYWORDS: list[tuple[str, str]] = [
    ("基礎", "基礎級"),
    ("高級", "高級"),
    ("中高", "中高級"),
    ("中級", "中級"),
    ("初級", "初級"),
]
DEFAULT_GRADE = "初級"


# ── JSON repair ───────────────────────────────────────────────────────────────

def _fix_english_field_quotes(text: str) -> str:
    """Escape unescaped double-quotes inside 'english_ridigned' field values.

    The source API embeds literal double-quote characters in English definitions
    (e.g. ``"a phrase (e.g. "Did you?" ...)"``), which makes the document
    invalid JSON.  We target only that field with a DOTALL regex and re-escape
    the interior quotes so standard json.loads() can succeed.
    """
    def _fix(m: re.Match) -> str:
        content = m.group(2)
        fixed = re.sub(r'(?<!\\)"', r'\\"', content)
        return f'"{m.group(1)}":"{fixed}"'

    return re.sub(
        r'"(english_ridigned)":"(.*?)"(?=,"|}")',
        _fix,
        text,
        flags=re.DOTALL,
    )


# ── Field normalisation ───────────────────────────────────────────────────────

def _cjk_only(value: str) -> str:
    """Extract only CJK Unified Ideograph characters from *value*."""
    return "".join(
        c for c in value if "一" <= c <= "鿿" or "㐀" <= c <= "䶿"
    )


def _normalize_accent(raw: str) -> str:
    """Map a (possibly garbled) accent label to a canonical dialect name.

    The source data contains records where leading characters of the dialect
    name are replaced by ASCII '?'.  We strip non-CJK characters and match
    against known labels by substring containment.
    """
    clean = _cjk_only(raw)
    if clean in VALID_ACCENTS:
        return clean
    # Partial-match fallback: e.g. '縣' → '四縣', '埔' → '大埔'
    for label in VALID_ACCENTS:
        if clean and (clean in label or label in clean):
            return label
    # Completely unresolvable — default to most common dialect
    return "四縣"


def _normalize_kind(raw: str) -> str:
    """Strip garbled '?' characters from category labels."""
    return _cjk_only(raw) or raw.replace("?", "").strip() or raw


def _infer_grade(category: str) -> str:
    """Derive a certification grade string from the category label."""
    for keyword, grade in GRADE_KEYWORDS:
        if keyword in category:
            return grade
    return DEFAULT_GRADE


# ── Fetch and parse ───────────────────────────────────────────────────────────

def fetch_data() -> list[dict]:
    """Download and parse the government open-data JSON.

    SSL verification is disabled because the server's certificate is missing
    the Subject Key Identifier extension required by Python 3.13's stricter
    verification.  We suppress the resulting InsecureRequestWarning.
    """
    warnings.filterwarnings("ignore", category=requests.packages.urllib3.exceptions.InsecureRequestWarning)  # type: ignore[attr-defined]
    print(f"[import_certified_vocab] Fetching {DATA_URL} ...")
    resp = requests.get(DATA_URL, timeout=120, verify=False)
    resp.raise_for_status()

    raw_text = resp.content.decode("utf-8", errors="strict")
    fixed_text = _fix_english_field_quotes(raw_text)
    payload = json.loads(fixed_text)
    records: list[dict] = payload["NewDataSet"]["Table"]
    print(f"[import_certified_vocab] Downloaded {len(records):,} raw records")
    return records


# ── Transform ─────────────────────────────────────────────────────────────────

def transform(records: list[dict]) -> list[dict]:
    """Map raw API records to certified_vocab column layout."""
    rows: list[dict] = []
    for r in records:
        category = _normalize_kind(r.get("kind", ""))
        accent   = _normalize_accent(r.get("accent", ""))
        word     = (r.get("hakka_risigned") or "").strip()
        pinyin   = (r.get("hakka_phonetic") or "").strip() or None
        mandarin = (r.get("chinese_risigned") or "").strip() or None
        grade    = _infer_grade(category)

        if not word:
            continue  # skip blank entries

        rows.append({
            "word":     word,
            "pinyin":   pinyin,
            "dialect":  accent,
            "grade":    grade,
            "category": category or None,
            "mandarin": mandarin,
        })
    return rows


# ── Upsert ────────────────────────────────────────────────────────────────────

async def upsert_rows(conn: asyncpg.Connection, rows: list[dict]) -> int:
    """Upsert *rows* into certified_vocab in batches.

    ON CONFLICT matches on (word, dialect) — the natural compound key for
    certified vocabulary entries.  A unique constraint is created here if it
    does not already exist so subsequent runs are idempotent.
    """
    # Ensure the unique constraint exists (idempotent)
    await conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_cert_word_dialect
        ON certified_vocab(word, dialect)
    """)

    upsert_sql = """
        INSERT INTO certified_vocab (word, pinyin, dialect, grade, category, mandarin)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (word, dialect) DO UPDATE SET
            pinyin   = EXCLUDED.pinyin,
            grade    = EXCLUDED.grade,
            category = EXCLUDED.category,
            mandarin = EXCLUDED.mandarin
    """

    total = len(rows)
    inserted = 0
    t0 = time.perf_counter()

    for batch_start in range(0, total, BATCH_SIZE):
        batch = rows[batch_start : batch_start + BATCH_SIZE]
        await conn.executemany(
            upsert_sql,
            [
                (r["word"], r["pinyin"], r["dialect"], r["grade"], r["category"], r["mandarin"])
                for r in batch
            ],
        )
        inserted += len(batch)
        if inserted % 1000 == 0 or inserted == total:
            elapsed = time.perf_counter() - t0
            print(f"  {inserted:,}/{total:,} rows  ({elapsed:.1f}s)")

    return inserted


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    records = fetch_data()
    rows = transform(records)
    print(f"[import_certified_vocab] {len(rows):,} rows to upsert (after transform)")

    print(f"[import_certified_vocab] Connecting to {DSN} ...")
    conn: asyncpg.Connection = await asyncpg.connect(DSN)
    try:
        count = await upsert_rows(conn, rows)
        print(f"[import_certified_vocab] Done — {count:,} rows upserted into certified_vocab")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
