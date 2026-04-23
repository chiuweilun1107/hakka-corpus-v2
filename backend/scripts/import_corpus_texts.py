#!/usr/bin/env python3
"""
建立 corpus_texts 表 + 匯入 data/corpus_texts/*.json 進 Supabase。

執行：
  python3 backend/scripts/import_corpus_texts.py
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import asyncpg

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "corpus_texts"
DATABASE_URL = "postgresql://postgres:postgres@localhost:54322/postgres"

CREATE_SQL = """
CREATE TABLE IF NOT EXISTS public.corpus_texts (
    id VARCHAR(100) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_pinyin TEXT,
    dialect VARCHAR(20),
    genre VARCHAR(30),
    author TEXT,
    source TEXT,
    source_url TEXT,
    license VARCHAR(50),
    year INT,
    word_count INT,
    categories JSONB,

    summary TEXT,
    summary_pinyin TEXT,
    summary_zh TEXT,
    topics JSONB,
    ner_entities JSONB,
    sentiment JSONB,
    analysis_updated_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corpus_texts_dialect ON public.corpus_texts(dialect);
CREATE INDEX IF NOT EXISTS idx_corpus_texts_genre ON public.corpus_texts(genre);
CREATE INDEX IF NOT EXISTS idx_corpus_texts_title ON public.corpus_texts(title);
"""


async def main():
    conn = await asyncpg.connect(DATABASE_URL)

    print("[step 1] 建立 corpus_texts 表…")
    await conn.execute(CREATE_SQL)
    print("  ✓ 表已建立/已存在")

    print("\n[step 2] 讀取 JSON 檔…")
    files = sorted(DATA_DIR.glob("*.json"))
    print(f"  找到 {len(files)} 個檔案")

    print("\n[step 3] 批次匯入…")
    ok = 0
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            await conn.execute(
                """
                INSERT INTO public.corpus_texts
                    (id, title, content, dialect, genre, source, source_url, license,
                     year, word_count, categories, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    updated_at = NOW()
                """,
                data["id"],
                data["title"],
                data["content"],
                data.get("dialect"),
                data.get("genre"),
                data.get("source"),
                data.get("source_url"),
                data.get("license"),
                data.get("year"),
                data.get("word_count"),
                json.dumps(data.get("categories", []), ensure_ascii=False),
                json.dumps({k: v for k, v in data.items() if k not in
                          ["id", "title", "content", "dialect", "genre", "source",
                           "source_url", "license", "year", "word_count", "categories"]},
                          ensure_ascii=False),
            )
            ok += 1
        except Exception as e:
            print(f"  ✗ {f.name}: {e}")

    print(f"  ✓ 匯入成功: {ok} 筆")

    # 統計
    print("\n[step 4] 驗證 DB 狀態…")
    cnt = await conn.fetchval("SELECT COUNT(*) FROM public.corpus_texts")
    print(f"  corpus_texts 總筆數: {cnt}")

    stats = await conn.fetch("SELECT genre, COUNT(*) FROM public.corpus_texts GROUP BY genre ORDER BY 2 DESC")
    print(f"\n  文類分布：")
    for r in stats:
        print(f"    {r['genre'] or '(未分類)'}: {r['count']}")

    await conn.close()
    print("\n✓ 完成")


if __name__ == "__main__":
    asyncio.run(main())
