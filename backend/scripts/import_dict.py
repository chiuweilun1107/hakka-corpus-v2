#!/usr/bin/env python3
"""Import dict-hakka.json into hakka_dict + pinyin_index tables.

Usage:
    python scripts/import_dict.py [--source PATH]

Defaults source to:
    /Users/chiuyongren/Desktop/hakka-corpus-proposal/prototype/dict-hakka.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import time
from pathlib import Path

import asyncpg

# ── Config ────────────────────────────────────────────
DSN = "postgresql://postgres:postgres@localhost:54322/postgres"
DEFAULT_SOURCE = (
    "/Users/chiuyongren/Desktop/hakka-corpus-proposal/prototype/dict-hakka.json"
)
BATCH_SIZE = 500

# ── Dialect label mapping ─────────────────────────────
DIALECT_MAP: dict[str, str] = {
    "四": "四縣",
    "海": "海陸",
    "大": "大埔",
    "平": "饒平",
    "安": "詔安",
    "南": "南四縣",
}

# Superscript tone digits (to strip for pinyin_base)
SUPERSCRIPT_TONES = str.maketrans("", "", "¹²³⁴⁵")

# U+20DE combining enclosing square
ENCLOSING_SQUARE = "\u20de"


def parse_pinyin(raw: str, word: str) -> list[dict]:
    """Parse a pinyin string like '四⃞su⁵⁵ 海⃞shu³³ ...' into structured records.

    Returns a list of dicts with keys: dialect, pinyin_full, pinyin_base.
    """
    if not raw or not raw.strip():
        return []

    results: list[dict] = []

    # Split by dialect labels: each segment starts with a CJK char + ⃞
    # Pattern: (label)(⃞)(pinyin_content)
    # We split on the dialect markers
    segments = re.split(r"([四海大平安南])\u20de", raw)

    # segments[0] is empty or whitespace before first label
    # Then pairs of (label, pinyin_content)
    i = 1
    while i < len(segments) - 1:
        label_char = segments[i].strip()
        pinyin_content = segments[i + 1].strip()
        i += 2

        if not label_char or not pinyin_content:
            continue

        dialect = DIALECT_MAP.get(label_char, label_char)

        # Clean: remove separators like 、文、白、，、－
        # These indicate literary/colloquial variants within the same dialect
        # We take the whole content as one pinyin_full
        pinyin_full = pinyin_content.strip()

        # Strip superscript tones and U+20DE for base
        pinyin_base = pinyin_full.translate(SUPERSCRIPT_TONES)
        pinyin_base = pinyin_base.replace(ENCLOSING_SQUARE, "")

        if pinyin_full:
            results.append({
                "dialect": dialect,
                "pinyin_full": pinyin_full,
                "pinyin_base": pinyin_base,
            })

    return results


def collect_definitions(heteronym: dict) -> str | None:
    """Extract all definitions from a heteronym, joined by '; '."""
    defs = []
    for d in heteronym.get("definitions", []):
        text = d.get("def", "").strip()
        if text:
            defs.append(text)
    return "; ".join(defs) if defs else None


async def main(source: str) -> None:
    print(f"[import_dict] Loading {source} ...")
    data: list[dict] = json.loads(Path(source).read_text(encoding="utf-8"))
    total = len(data)
    print(f"[import_dict] Loaded {total:,} entries")

    print(f"[import_dict] Connecting to {DSN} ...")
    conn: asyncpg.Connection = await asyncpg.connect(DSN)

    try:
        # Truncate for idempotency (pinyin_index first due to FK)
        await conn.execute("TRUNCATE pinyin_index, hakka_dict RESTART IDENTITY CASCADE")
        print("[import_dict] Tables truncated")

        # ── Phase 1: Insert hakka_dict ────────────────
        t0 = time.perf_counter()
        dict_rows: list[tuple] = []
        for entry in data:
            dict_rows.append((
                entry["title"],
                json.dumps(entry.get("heteronyms", []), ensure_ascii=False),
                json.dumps(entry, ensure_ascii=False),
            ))

        # Bulk insert and return IDs
        inserted_ids: list[int] = []
        for batch_start in range(0, len(dict_rows), BATCH_SIZE):
            batch = dict_rows[batch_start : batch_start + BATCH_SIZE]
            rows = await conn.fetch(
                """
                INSERT INTO hakka_dict (title, heteronyms, raw_json)
                SELECT u.title, u.heteronyms::jsonb, u.raw_json::jsonb
                FROM unnest($1::text[], $2::text[], $3::text[])
                    AS u(title, heteronyms, raw_json)
                RETURNING id
                """,
                [r[0] for r in batch],
                [r[1] for r in batch],
                [r[2] for r in batch],
            )
            inserted_ids.extend(r["id"] for r in rows)

            count = batch_start + len(batch)
            if count % 1000 == 0 or count == total:
                print(f"  hakka_dict: {count:,}/{total:,}")

        elapsed = time.perf_counter() - t0
        print(f"[import_dict] hakka_dict: {len(inserted_ids):,} rows in {elapsed:.1f}s")

        # ── Phase 2: Build and insert pinyin_index ────
        t1 = time.perf_counter()
        pinyin_rows: list[tuple] = []
        for idx, entry in enumerate(data):
            dict_id = inserted_ids[idx]
            word = entry["title"]
            for heteronym in entry.get("heteronyms", []):
                raw_pinyin = heteronym.get("pinyin", "")
                definition = collect_definitions(heteronym)
                parsed = parse_pinyin(raw_pinyin, word)
                for p in parsed:
                    pinyin_rows.append((
                        dict_id,
                        word,
                        p["pinyin_full"],
                        p["pinyin_base"],
                        p["dialect"],
                        definition,
                    ))

        pinyin_total = len(pinyin_rows)
        print(f"[import_dict] Parsed {pinyin_total:,} pinyin records")

        for batch_start in range(0, pinyin_total, BATCH_SIZE):
            batch = pinyin_rows[batch_start : batch_start + BATCH_SIZE]
            await conn.execute(
                """
                INSERT INTO pinyin_index (dict_id, word, pinyin_full, pinyin_base, dialect, definition)
                SELECT u.dict_id, u.word, u.pinyin_full, u.pinyin_base, u.dialect, u.definition
                FROM unnest($1::int[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])
                    AS u(dict_id, word, pinyin_full, pinyin_base, dialect, definition)
                """,
                [r[0] for r in batch],
                [r[1] for r in batch],
                [r[2] for r in batch],
                [r[3] for r in batch],
                [r[4] for r in batch],
                [r[5] for r in batch],
            )

            count = batch_start + len(batch)
            if count % 1000 == 0 or count == pinyin_total:
                print(f"  pinyin_index: {count:,}/{pinyin_total:,}")

        elapsed2 = time.perf_counter() - t1
        print(f"[import_dict] pinyin_index: {pinyin_total:,} rows in {elapsed2:.1f}s")

        total_elapsed = time.perf_counter() - t0
        print(f"[import_dict] Done in {total_elapsed:.1f}s")

    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import Hakka dictionary JSON")
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help=f"Path to dict-hakka.json (default: {DEFAULT_SOURCE})",
    )
    args = parser.parse_args()

    if not Path(args.source).exists():
        print(f"ERROR: Source file not found: {args.source}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(main(args.source))
