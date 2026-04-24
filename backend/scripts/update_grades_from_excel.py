"""
update_grades_from_excel.py

Downloads ODS vocabulary files from elearning.hakka.gov.tw for all grade levels
and all dialects (114年/2025 editions, plus 113年 for 高級), then UPDATEs
certified_vocab.grade in the PostgreSQL database.

Processing order (higher grades are applied last so they "win"):
    基礎級 → 初級 → 中級 → 中高級 → 高級

Usage:
    python update_grades_from_excel.py
"""

import asyncio
import io
import warnings
import asyncpg
import pandas as pd
import requests

warnings.filterwarnings("ignore")

DSN = "postgresql://postgres:postgres@localhost:54322/postgres"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# Dialect mapping: Excel label suffix → DB dialect value
DIALECT_MAP = {
    "四縣": "四縣",
    "海陸": "海陸",
    "大埔": "大埔",
    "饒平": "饒平",
    "詔安": "詔安",
}

# All target files: (grade, dialect_key, url)
# Using 114年 (most recent) for 基礎級/初級/中級/中高級
# 中高級 files on 114年 are labeled "中級暨中高級" combined — they contain
# both 中級 and 中高級 rows in one sheet.  We download them separately per grade.
# 高級 uses 113年 (latest available).

FILES = [
    # ── 基礎級 (114年) ──────────────────────────────────
    ("基礎級", "四縣", "https://elearning.hakka.gov.tw/hakka/files/downloads/506.ods"),
    ("基礎級", "海陸", "https://elearning.hakka.gov.tw/hakka/files/downloads/510.ods"),
    ("基礎級", "大埔", "https://elearning.hakka.gov.tw/hakka/files/downloads/514.ods"),
    ("基礎級", "饒平", "https://elearning.hakka.gov.tw/hakka/files/downloads/518.ods"),
    ("基礎級", "詔安", "https://elearning.hakka.gov.tw/hakka/files/downloads/522.ods"),
    # ── 初級 (114年) ──────────────────────────────────
    ("初級", "四縣", "https://elearning.hakka.gov.tw/hakka/files/downloads/507.ods"),
    ("初級", "海陸", "https://elearning.hakka.gov.tw/hakka/files/downloads/511.ods"),
    ("初級", "大埔", "https://elearning.hakka.gov.tw/hakka/files/downloads/515.ods"),
    ("初級", "饒平", "https://elearning.hakka.gov.tw/hakka/files/downloads/519.ods"),
    ("初級", "詔安", "https://elearning.hakka.gov.tw/hakka/files/downloads/523.ods"),
    # ── 中級 (114年) — sheet "中級-*" inside the combined file ──
    ("中級", "四縣", "https://elearning.hakka.gov.tw/hakka/files/downloads/541.ods"),
    ("中級", "海陸", "https://elearning.hakka.gov.tw/hakka/files/downloads/546.ods"),
    ("中級", "大埔", "https://elearning.hakka.gov.tw/hakka/files/downloads/551.ods"),
    ("中級", "饒平", "https://elearning.hakka.gov.tw/hakka/files/downloads/556.ods"),
    ("中級", "詔安", "https://elearning.hakka.gov.tw/hakka/files/downloads/561.ods"),
    # ── 中高級 (114年) — sheet "中高級-*" inside the combined file ──
    ("中高級", "四縣", "https://elearning.hakka.gov.tw/hakka/files/downloads/542.ods"),
    ("中高級", "海陸", "https://elearning.hakka.gov.tw/hakka/files/downloads/547.ods"),
    ("中高級", "大埔", "https://elearning.hakka.gov.tw/hakka/files/downloads/552.ods"),
    ("中高級", "饒平", "https://elearning.hakka.gov.tw/hakka/files/downloads/557.ods"),
    ("中高級", "詔安", "https://elearning.hakka.gov.tw/hakka/files/downloads/562.ods"),
    # ── 高級 (113年, latest available) ──────────────────
    ("高級", "四縣", "https://elearning.hakka.gov.tw/hakka/files/downloads/486.ods"),
    ("高級", "海陸", "https://elearning.hakka.gov.tw/hakka/files/downloads/490.ods"),
    ("高級", "大埔", "https://elearning.hakka.gov.tw/hakka/files/downloads/494.ods"),
    ("高級", "饒平", "https://elearning.hakka.gov.tw/hakka/files/downloads/498.ods"),
    ("高級", "詔安", "https://elearning.hakka.gov.tw/hakka/files/downloads/502.ods"),
]

# Processing order: lower grades first so higher grades overwrite them
GRADE_ORDER = ["基礎級", "初級", "中級", "中高級", "高級"]


def download_ods(url: str) -> bytes:
    """Download an ODS file, returning raw bytes."""
    resp = requests.get(url, headers=HEADERS, verify=False, timeout=60)
    resp.raise_for_status()
    return resp.content


def extract_words_from_ods(content: bytes, grade: str, dialect_key: str) -> list[str]:
    """
    Parse an ODS file and return the list of Hakka words (客家語 column).

    The word column name varies across files:
      - 基礎級/初級/中級/中高級: "{dialect}客家語"  (e.g. 四縣客家語)
      - 高級:                   "{dialect}客語詞彙" (e.g. 四縣客語詞彙)

    For combined 中級暨中高級 files (114年 中級/中高級), the workbook contains
    two sheets — "中級-{dialect}" and "中高級-{dialect}".  We pick the sheet
    whose name starts with the requested grade.
    """
    all_sheets: dict[str, pd.DataFrame] = pd.read_excel(
        io.BytesIO(content), engine="odf", sheet_name=None
    )

    # Pick the right sheet
    target_sheet_df = None
    grade_prefix = grade  # e.g. "中高級"

    for sheet_name, df in all_sheets.items():
        # Exact match or starts-with match (handles "中高級-四縣" etc.)
        if sheet_name.startswith(grade_prefix):
            target_sheet_df = df
            break

    if target_sheet_df is None:
        # Fallback: if only one sheet, use it
        if len(all_sheets) == 1:
            target_sheet_df = list(all_sheets.values())[0]
        else:
            sheet_names = list(all_sheets.keys())
            raise ValueError(
                f"Cannot find sheet for grade='{grade}' dialect='{dialect_key}'. "
                f"Available sheets: {sheet_names}"
            )

    df = target_sheet_df

    # Find the word column
    word_col = None
    candidates = [
        f"{dialect_key}客家語",
        f"{dialect_key}客語詞彙",
        f"{dialect_key}腔客家語",
        f"{dialect_key}腔客語詞彙",
    ]
    for col in candidates:
        if col in df.columns:
            word_col = col
            break

    if word_col is None:
        # Last resort: look for any column containing "客家語" or "客語詞彙"
        for col in df.columns:
            if "客家語" in str(col) or "客語詞彙" in str(col):
                word_col = col
                break

    if word_col is None:
        raise ValueError(
            f"Cannot find word column in {grade}/{dialect_key}. "
            f"Columns: {list(df.columns)}"
        )

    words = (
        df[word_col]
        .dropna()
        .astype(str)
        .str.strip()
        .tolist()
    )
    # Filter out empty strings and header-like values
    words = [w for w in words if w and w != word_col]
    return words


async def update_grade_batch(
    conn: asyncpg.Connection,
    grade: str,
    dialect: str,
    words: list[str],
) -> int:
    """
    Batch UPDATE certified_vocab.grade for matching (word, dialect) pairs.
    Returns number of rows updated.
    """
    if not words:
        return 0

    result = await conn.execute(
        """
        UPDATE certified_vocab
        SET grade = $1
        WHERE word = ANY($2::text[])
          AND dialect = $3
        """,
        grade,
        words,
        dialect,
    )
    # result is a string like "UPDATE 123"
    updated = int(result.split()[-1])
    return updated


async def main():
    print("Connecting to database...")
    conn = await asyncpg.connect(DSN)

    try:
        # Show initial distribution
        rows = await conn.fetch(
            "SELECT grade, COUNT(*) AS cnt FROM certified_vocab GROUP BY grade ORDER BY grade"
        )
        print("\nInitial grade distribution:")
        for r in rows:
            print(f"  {r['grade']}: {r['cnt']}")

        total_updated = 0
        summary: dict[str, int] = {}

        # Process in grade order so higher grades override lower ones
        # Build a lookup: (grade, dialect) -> file entry
        file_map: dict[tuple[str, str], str] = {
            (g, d): url for g, d, url in FILES
        }

        for grade in GRADE_ORDER:
            grade_total = 0
            for dialect_key in ["四縣", "海陸", "大埔", "饒平", "詔安"]:
                url = file_map.get((grade, dialect_key))
                if url is None:
                    continue

                print(f"\nDownloading {grade}/{dialect_key} from {url} ...")
                try:
                    content = download_ods(url)
                    print(f"  Downloaded {len(content):,} bytes")

                    words = extract_words_from_ods(content, grade, dialect_key)
                    print(f"  Extracted {len(words)} words")

                    if not words:
                        print("  WARNING: no words extracted, skipping")
                        continue

                    updated = await update_grade_batch(conn, grade, dialect_key, words)
                    print(f"  Updated {updated} rows in DB")
                    grade_total += updated

                except Exception as exc:
                    print(f"  ERROR: {exc}")
                    continue

            summary[grade] = grade_total
            total_updated += grade_total

        print("\n" + "=" * 60)
        print("UPDATE SUMMARY BY GRADE:")
        for grade in GRADE_ORDER:
            print(f"  {grade}: {summary.get(grade, 0)} rows updated")
        print(f"  Total: {total_updated} rows updated")

        # Final distribution
        rows = await conn.fetch(
            "SELECT grade, COUNT(*) AS cnt FROM certified_vocab GROUP BY grade ORDER BY grade"
        )
        print("\nFinal grade distribution:")
        for r in rows:
            print(f"  {r['grade']}: {r['cnt']}")

    finally:
        await conn.close()
        print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
