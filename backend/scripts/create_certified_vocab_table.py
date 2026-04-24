#!/usr/bin/env python3
"""Create the certified_vocab table and indexes in PostgreSQL.

Usage:
    python scripts/create_certified_vocab_table.py
"""

from __future__ import annotations

import asyncio

import asyncpg

DSN = "postgresql://postgres:postgres@localhost:54322/postgres"


async def main() -> None:
    print(f"[create_certified_vocab_table] Connecting to {DSN} ...")
    conn: asyncpg.Connection = await asyncpg.connect(DSN)
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS certified_vocab (
                id         SERIAL PRIMARY KEY,
                word       TEXT NOT NULL,
                pinyin     TEXT,
                dialect    TEXT,
                grade      TEXT NOT NULL,
                category   TEXT,
                mandarin   TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cert_word ON certified_vocab(word)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cert_word_dialect ON certified_vocab(word, dialect)"
        )
        print("Table created")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
