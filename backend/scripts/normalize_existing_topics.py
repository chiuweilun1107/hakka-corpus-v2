#!/usr/bin/env python3
"""
一次性 migration：把 corpus_texts.topics 裡舊的冗長主題名稱，
映射到新的 12 類固定清單（與 run_ai_analysis.py 共用 normalize_topics）。

執行：
  python3 backend/scripts/normalize_existing_topics.py           # dry-run
  python3 backend/scripts/normalize_existing_topics.py --apply   # 實際寫入 DB
"""

from __future__ import annotations

import argparse
import asyncio
import json

import asyncpg

from run_ai_analysis import normalize_topics, TOPIC_TAXONOMY

DATABASE_URL = "postgresql://postgres:postgres@localhost:54322/postgres"


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="實際寫入 DB；未加則只 dry-run")
    args = parser.parse_args()

    print(f"[taxonomy] {TOPIC_TAXONOMY}")
    print(f"[mode] {'APPLY (會寫入 DB)' if args.apply else 'DRY-RUN (不寫入)'}")
    print()

    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch(
        "SELECT id, title, topics FROM public.corpus_texts "
        "WHERE topics IS NOT NULL ORDER BY id"
    )
    print(f"[fetch] {len(rows)} 筆有 topics 的資料\n")

    changed = 0
    unchanged = 0
    for r in rows:
        old_topics = r["topics"]
        if isinstance(old_topics, str):
            try:
                old_topics = json.loads(old_topics)
            except json.JSONDecodeError:
                continue
        if not old_topics:
            continue

        new_topics = normalize_topics(old_topics)
        old_names = [t.get("name", "") for t in old_topics if isinstance(t, dict)]
        new_names = [t.get("name", "") for t in new_topics]

        if old_names == new_names:
            unchanged += 1
            continue

        changed += 1
        print(f"  [{r['id']}] {r['title'][:30]}")
        print(f"    舊: {' / '.join(old_names)}")
        print(f"    新: {' / '.join(new_names)}")

        if args.apply:
            await conn.execute(
                "UPDATE public.corpus_texts SET topics = $1, updated_at = NOW() WHERE id = $2",
                json.dumps(new_topics, ensure_ascii=False),
                r["id"],
            )

    await conn.close()
    print()
    print(f"[summary] 變更: {changed} / 保持: {unchanged} / 總計: {len(rows)}")
    if not args.apply and changed > 0:
        print("→ 若確認無誤，加 --apply 實際寫入 DB")


if __name__ == "__main__":
    asyncio.run(main())
