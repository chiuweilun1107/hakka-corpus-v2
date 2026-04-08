#!/usr/bin/env python3
"""Import cooc_db.json into the cooccurrence table.

Usage:
    python scripts/import_cooc.py [--source PATH]

Defaults source to:
    /Users/chiuyongren/Desktop/hakka-corpus-proposal/prototype/cooc_db.json
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

import asyncpg

# ── Config ────────────────────────────────────────────
DSN = "postgresql://postgres:postgres@localhost:54322/postgres"
DEFAULT_SOURCE = (
    "/Users/chiuyongren/Desktop/hakka-corpus-proposal/prototype/cooc_db.json"
)
BATCH_SIZE = 2000


async def main(source: str) -> None:
    print(f"[import_cooc] Loading {source} ...")
    raw: dict[str, list[dict]] = json.loads(Path(source).read_text(encoding="utf-8"))
    keyword_count = len(raw)
    print(f"[import_cooc] Loaded {keyword_count:,} keywords")

    # Flatten into rows
    print("[import_cooc] Flattening rows ...")
    rows: list[tuple] = []
    for keyword, partners in raw.items():
        for item in partners:
            rows.append((
                keyword,
                item["word"],
                item.get("count", 0),
                item.get("freq", 0),
                item.get("logdice", 0),
                item.get("mi", 0),
            ))

    total = len(rows)
    print(f"[import_cooc] Total rows: {total:,}")

    print(f"[import_cooc] Connecting to {DSN} ...")
    conn: asyncpg.Connection = await asyncpg.connect(DSN)

    try:
        # Truncate for idempotency
        await conn.execute("TRUNCATE cooccurrence RESTART IDENTITY")
        print("[import_cooc] Table truncated")

        t0 = time.perf_counter()

        for batch_start in range(0, total, BATCH_SIZE):
            batch = rows[batch_start : batch_start + BATCH_SIZE]

            await conn.execute(
                """
                INSERT INTO cooccurrence (word, partner, co_count, word_freq, logdice, mi_score)
                SELECT u.word, u.partner, u.co_count, u.word_freq, u.logdice, u.mi_score
                FROM unnest(
                    $1::text[],
                    $2::text[],
                    $3::int[],
                    $4::int[],
                    $5::numeric[],
                    $6::numeric[]
                ) AS u(word, partner, co_count, word_freq, logdice, mi_score)
                """,
                [r[0] for r in batch],
                [r[1] for r in batch],
                [r[2] for r in batch],
                [r[3] for r in batch],
                [r[4] for r in batch],
                [r[5] for r in batch],
            )

            count = batch_start + len(batch)
            if count % 10000 == 0 or count == total:
                elapsed = time.perf_counter() - t0
                rate = count / elapsed if elapsed > 0 else 0
                print(f"  cooccurrence: {count:,}/{total:,}  ({rate:,.0f} rows/s)")

        elapsed = time.perf_counter() - t0
        print(f"[import_cooc] Done: {total:,} rows in {elapsed:.1f}s")

    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import cooccurrence JSON")
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help=f"Path to cooc_db.json (default: {DEFAULT_SOURCE})",
    )
    args = parser.parse_args()

    if not Path(args.source).exists():
        print(f"ERROR: Source file not found: {args.source}", file=sys.stderr)
        sys.exit(1)

    asyncio.run(main(args.source))
