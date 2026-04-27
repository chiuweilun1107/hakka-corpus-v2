"""
Build position-based collocate table (cooc_positional) from corpus_texts.

Position → category mapping (approximate, demo-quality):
  dist -1  (token directly LEFT)   → N_Modifier  (modifies keyword)
  dist +1  (token directly RIGHT)  → Modifies    (keyword modifies this)
  dist -2..-3                      → Object_of   (keyword may be object)
  dist +2..+3                      → Subject_of  (keyword may be subject)
  A 的/介/个 keyword  or  keyword 的/介/个 B → Possession

Tokenizer: dict-based max-match (length 4→2) using hakka_dict titles.

Usage:
  python3 build_positional_cooc.py            # full run
  python3 build_positional_cooc.py --limit 3  # first 3 texts only
  python3 build_positional_cooc.py --dry-run  # print tokens, no DB write
  python3 build_positional_cooc.py --reset    # truncate table before run
  python3 build_positional_cooc.py --min-len 2  # skip single-char partners
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

# ── Constants ───────────────────────────────────────────────────────────────

_PUNCT = set("，。、；：！？「」『』（）《》〈〉…—－-·．. \n\t　")
_POSS_MARKERS = set("的介个")
_CJK_RE = re.compile(r"[一-鿿\U00020000-\U0002fa1f]")

_DIST_TO_CAT = {
    -1: "N_Modifier",
    +1: "Modifies",
    -2: "Object_of",
    -3: "Object_of",
    +2: "Subject_of",
    +3: "Subject_of",
}


# ── Tokenizer ────────────────────────────────────────────────────────────────

def tokenize(text: str, vocab: set[str], min_len: int = 1) -> list[str]:
    """Max-match tokenizer using vocab set. Keeps CJK chars only."""
    tokens: list[str] = []
    i = 0
    while i < len(text):
        ch = text[i]
        if ch in _PUNCT or not _CJK_RE.match(ch):
            i += 1
            continue
        matched = False
        for length in (4, 3, 2):
            if length < min_len:
                break
            seg = text[i : i + length]
            if len(seg) == length and seg in vocab:
                tokens.append(seg)
                i += length
                matched = True
                break
        if not matched:
            # single character fallback (always included as token)
            tokens.append(ch)
            i += 1
    return tokens


# ── Category assignment ──────────────────────────────────────────────────────

def assign_category(tokens: list[str], kw_idx: int, partner_idx: int) -> str | None:
    dist = partner_idx - kw_idx
    partner = tokens[partner_idx]
    if dist == 0 or abs(dist) > 3:
        return None

    # Possession: 的/介/个 between keyword and partner
    if abs(dist) == 2:
        mid = tokens[kw_idx + (1 if dist > 0 else -1)]
        if mid in _POSS_MARKERS:
            return "Possession"

    return _DIST_TO_CAT.get(dist)


# ── Main ─────────────────────────────────────────────────────────────────────

async def run(limit: int | None, dry_run: bool, reset: bool, min_len: int) -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Load vocab
        print("Loading vocab from hakka_dict …")
        result = await db.execute(text("SELECT title FROM hakka_dict WHERE LENGTH(title) >= 2"))
        vocab: set[str] = {row[0] for row in result.fetchall()}
        print(f"  {len(vocab):,} words loaded")

        # Optionally reset
        if reset and not dry_run:
            await db.execute(text("TRUNCATE TABLE cooc_positional RESTART IDENTITY"))
            await db.commit()
            print("Table cooc_positional truncated.")

        # Load corpus texts
        q = "SELECT id, title, content FROM corpus_texts WHERE content IS NOT NULL ORDER BY id"
        if limit:
            q += f" LIMIT {limit}"
        result = await db.execute(text(q))
        texts = result.fetchall()
        print(f"Processing {len(texts)} texts …\n")

        # Accumulate counts: {(word, partner, category): count}
        counts: dict[tuple[str, str, str], int] = defaultdict(int)

        for row in texts:
            content: str = row[2] or ""
            tokens = tokenize(content, vocab, min_len=min_len)

            if dry_run:
                print(f"[{row[1]}] tokens (first 30):", tokens[:30])

            for i, kw in enumerate(tokens):
                if kw in _PUNCT or len(kw) < min_len:
                    continue
                for j in range(max(0, i - 3), min(len(tokens), i + 4)):
                    if j == i:
                        continue
                    partner = tokens[j]
                    if partner in _PUNCT or len(partner) < min_len:
                        continue
                    cat = assign_category(tokens, i, j)
                    if cat:
                        counts[(kw, partner, cat)] += 1

        print(f"\nTotal (word, partner, category) pairs: {len(counts):,}")

        if dry_run:
            print("\n[dry-run] Top 20 pairs:")
            for (w, p, c), n in sorted(counts.items(), key=lambda x: -x[1])[:20]:
                print(f"  {w} | {p} | {c} | {n}")
            return

        # Batch upsert
        print("Writing to cooc_positional …")
        batch = []
        for (word, partner, category), count in counts.items():
            batch.append({"word": word, "partner": partner, "category": category, "count": count})
            if len(batch) >= 2000:
                await db.execute(
                    text("""
                        INSERT INTO cooc_positional (word, partner, category, count)
                        VALUES (:word, :partner, :category, :count)
                        ON CONFLICT (word, partner, category)
                        DO UPDATE SET count = cooc_positional.count + EXCLUDED.count
                    """),
                    batch,
                )
                await db.commit()
                batch = []

        if batch:
            await db.execute(
                text("""
                    INSERT INTO cooc_positional (word, partner, category, count)
                    VALUES (:word, :partner, :category, :count)
                    ON CONFLICT (word, partner, category)
                    DO UPDATE SET count = cooc_positional.count + EXCLUDED.count
                """),
                batch,
            )
            await db.commit()

        result = await db.execute(text("SELECT COUNT(*) FROM cooc_positional"))
        total = result.scalar()
        print(f"Done. cooc_positional now has {total:,} rows.")

    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Process only first N texts")
    parser.add_argument("--dry-run", action="store_true", help="Print tokens/pairs, skip DB write")
    parser.add_argument("--reset", action="store_true", help="Truncate table before run")
    parser.add_argument("--min-len", type=int, default=2, help="Min partner token length (default 2)")
    args = parser.parse_args()
    asyncio.run(run(args.limit, args.dry_run, args.reset, args.min_len))
