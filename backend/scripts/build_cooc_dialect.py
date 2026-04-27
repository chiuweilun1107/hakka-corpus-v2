"""
Build dialect-segmented cooccurrence table (cooc_dialect) from corpus_texts.

Window: ±3 tokens around each keyword. No category classification — only
accumulates (word, partner, dialect) → co_count.

Table schema (created if not exists):
  cooc_dialect(id BIGSERIAL, word TEXT, partner TEXT, dialect VARCHAR(20),
               co_count INT, UNIQUE(word, partner, dialect))

Usage:
  python3 build_cooc_dialect.py            # full run
  python3 build_cooc_dialect.py --limit 3  # first 3 texts only
  python3 build_cooc_dialect.py --dry-run  # print tokens, no DB write
  python3 build_cooc_dialect.py --reset    # truncate table before run
  python3 build_cooc_dialect.py --min-len 2  # skip single-char partners (default)
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
from collections import defaultdict
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import get_settings

settings = get_settings()

# ── Constants ─────────────────────────────────────────────────────────────────

_PUNCT = set("，。、；：！？「」『』（）《》〈〉…—－-·．. \n\t　")
_CJK_RE = re.compile(r"[一-鿿\U00020000-\U0002fa1f]")

_WINDOW = 3  # ±3 tokens

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS cooc_dialect (
    id       BIGSERIAL PRIMARY KEY,
    word     TEXT        NOT NULL,
    partner  TEXT        NOT NULL,
    dialect  VARCHAR(20) NOT NULL,
    co_count INTEGER     NOT NULL DEFAULT 1,
    CONSTRAINT uq_cooc_dialect UNIQUE (word, partner, dialect)
);
CREATE INDEX IF NOT EXISTS ix_cooc_dialect_word    ON cooc_dialect (word);
CREATE INDEX IF NOT EXISTS ix_cooc_dialect_dialect ON cooc_dialect (dialect);
"""

_UPSERT_SQL = """
    INSERT INTO cooc_dialect (word, partner, dialect, co_count)
    VALUES (:word, :partner, :dialect, :co_count)
    ON CONFLICT (word, partner, dialect)
    DO UPDATE SET co_count = cooc_dialect.co_count + EXCLUDED.co_count
"""


# ── Tokenizer ─────────────────────────────────────────────────────────────────

def tokenize(content: str, vocab: set[str], min_len: int = 1) -> list[str]:
    """Max-match tokenizer (length 4→2) using vocab set. Keeps CJK chars only."""
    tokens: list[str] = []
    i = 0
    while i < len(content):
        ch = content[i]
        if ch in _PUNCT or not _CJK_RE.match(ch):
            i += 1
            continue
        matched = False
        for length in (4, 3, 2):
            if length < min_len:
                break
            seg = content[i : i + length]
            if len(seg) == length and seg in vocab:
                tokens.append(seg)
                i += length
                matched = True
                break
        if not matched:
            # single-character fallback
            tokens.append(ch)
            i += 1
    return tokens


# ── Main ──────────────────────────────────────────────────────────────────────

async def run(limit: int | None, dry_run: bool, reset: bool, min_len: int) -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Ensure table exists
        print("Ensuring cooc_dialect table exists …")
        for stmt in _CREATE_TABLE_SQL.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                await db.execute(text(stmt))
        await db.commit()

        # Load vocab from hakka_dict
        print("Loading vocab from hakka_dict …")
        vocab_result = await db.execute(
            text("SELECT title FROM hakka_dict WHERE LENGTH(title) >= 2")
        )
        vocab: set[str] = {row[0] for row in vocab_result.fetchall()}
        print(f"  {len(vocab):,} words loaded")

        # Optionally reset
        if reset and not dry_run:
            await db.execute(text("TRUNCATE TABLE cooc_dialect RESTART IDENTITY"))
            await db.commit()
            print("Table cooc_dialect truncated.")

        # Load corpus texts with dialect
        q = (
            "SELECT id, content, dialect "
            "FROM corpus_texts "
            "WHERE content IS NOT NULL AND dialect IS NOT NULL "
            "ORDER BY id"
        )
        if limit:
            q += f" LIMIT {limit}"
        corpus_result = await db.execute(text(q))
        texts = corpus_result.fetchall()
        print(f"Processing {len(texts):,} texts …\n")

        # Accumulate counts: {(word, partner, dialect): co_count}
        counts: dict[tuple[str, str, str], int] = defaultdict(int)

        for row in texts:
            text_id: int = row[0]
            content: str = row[1] or ""
            dialect: str = row[2]

            tokens = tokenize(content, vocab, min_len=min_len)

            if dry_run:
                print(f"[id={text_id} dialect={dialect}] tokens (first 30):", tokens[:30])

            for i, kw in enumerate(tokens):
                if kw in _PUNCT or len(kw) < min_len:
                    continue
                start_j = max(0, i - _WINDOW)
                end_j = min(len(tokens), i + _WINDOW + 1)
                for j in range(start_j, end_j):
                    if j == i:
                        continue
                    partner = tokens[j]
                    if partner in _PUNCT or len(partner) < min_len:
                        continue
                    counts[(kw, partner, dialect)] += 1

        print(f"\nTotal (word, partner, dialect) pairs: {len(counts):,}")

        if dry_run:
            print("\n[dry-run] Top 20 pairs:")
            for (w, p, d), n in sorted(counts.items(), key=lambda x: -x[1])[:20]:
                print(f"  {w} | {p} | {d} | {n}")
            return

        # Batch upsert
        print("Writing to cooc_dialect …")
        batch: list[dict] = []
        written = 0

        for (word, partner, dialect), co_count in counts.items():
            batch.append(
                {"word": word, "partner": partner, "dialect": dialect, "co_count": co_count}
            )
            if len(batch) >= 2000:
                await db.execute(text(_UPSERT_SQL), batch)
                await db.commit()
                written += len(batch)
                print(f"  … {written:,} pairs written", end="\r")
                batch = []

        if batch:
            await db.execute(text(_UPSERT_SQL), batch)
            await db.commit()
            written += len(batch)

        print(f"\nBatch write complete: {written:,} pairs upserted.")

        final_result = await db.execute(text("SELECT COUNT(*) FROM cooc_dialect"))
        total_rows = final_result.scalar()
        print(f"Done. cooc_dialect now has {total_rows:,} rows.")

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build cooc_dialect table from corpus_texts."
    )
    parser.add_argument(
        "--limit", type=int, default=None, help="Process only first N texts"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print tokens/pairs, skip DB write",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Truncate cooc_dialect table before run",
    )
    parser.add_argument(
        "--min-len",
        type=int,
        default=2,
        help="Min token length for word and partner (default 2)",
    )
    args = parser.parse_args()
    asyncio.run(run(args.limit, args.dry_run, args.reset, args.min_len))
