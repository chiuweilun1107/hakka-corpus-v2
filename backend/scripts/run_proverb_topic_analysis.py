#!/usr/bin/env python3
"""
對 daily_proverbs 表裡每一則諺語跑主題標注（Gemini Flash）。

使用與 corpus_texts 相同的統一 16 類 taxonomy。
諺語較短，只標注 topics（不做 summary / NER / emotion）。

執行：
  python3 backend/scripts/run_proverb_topic_analysis.py [--limit N] [--force] [--dry-run]
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import asyncpg
from gemini_webapi import GeminiClient
from gemini_webapi.constants import Model

from _topic_taxonomy import UNIFIED_TAXONOMY, normalize_topics

DATABASE_URL = "postgresql://postgres:postgres@localhost:54322/postgres"
STORAGE_STATE = Path.home() / ".notebooklm" / "storage_state.json"

TAXONOMY_STR = "、".join(UNIFIED_TAXONOMY)

PROVERB_TOPIC_PROMPT = """你是客語 NLP 分析系統。以下是一則客語諺語，請分析其內容主題並用 JSON 格式回傳。

【諺語】{title}
【類別】{category}
【釋義】{definition}

【任務】回傳**單一 JSON 物件**（不要包 markdown code block）：
{{
  "topics": [
    {{"name": "<必須從下方 16 類清單中擇一>", "percentage": <0-100>}},
    ...（最多 2 個主題，通常只需 1 個）
  ]
}}

**規則**：
- topics.name 必須從以下 16 類固定清單中選出（不可自創名稱）：
  [{taxonomy}]
- 通常選 1 個主題（percentage=100）；意象橫跨兩類時最多 2 個（percentage 加總=100）
- 諺語常見對應：
  - 直接命令、警告、禁止 → 勸戒
  - 人情世故、觀察體悟 → 處世
  - 勤勞、勤儉、努力、堅持 → 勤勞
  - 以事物比喻人事 → 比喻
  - 農耕、天氣農業 → 產業
  - 飲食相關 → 飲食
- 只回傳 JSON，不要任何額外說明文字"""


def extract_json(text: str) -> dict | None:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:].strip()
        text = text.rsplit("```", 1)[0].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  ⚠ JSON parse error: {e}; raw: {text[:200]}")
        return None


async def analyze_one(client: GeminiClient, row: dict) -> list | None:
    prompt = PROVERB_TOPIC_PROMPT.format(
        title=row["title"],
        category=row.get("category", "諺語"),
        definition=(row.get("definition") or "")[:200],
        taxonomy=TAXONOMY_STR,
    )
    try:
        resp = await client.generate_content(prompt, model=Model.BASIC_FLASH)
        result = extract_json(resp.text)
        return result.get("topics") if result else None
    except Exception as e:
        print(f"  ⚠ Gemini error: {e}")
        return None


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=541, help="處理筆數（預設全部）")
    parser.add_argument("--force", action="store_true", help="重跑已有 topics 的筆")
    parser.add_argument("--dry-run", action="store_true", help="只印結果，不寫 DB")
    args = parser.parse_args()

    # 1. Init Gemini
    print("[init] 初始化 Gemini client…")
    storage = json.loads(STORAGE_STATE.read_text())
    cookies = {c["name"]: c["value"] for c in storage["cookies"] if c.get("domain", "").endswith("google.com")}
    client = GeminiClient(cookies.get("__Secure-1PSID"), cookies.get("__Secure-1PSIDTS"))
    await client.init()
    print("  ✓ Gemini client ready")

    # 2. Fetch rows
    conn = await asyncpg.connect(DATABASE_URL)
    if args.force:
        rows = await conn.fetch(
            "SELECT id, title, category, definition FROM public.daily_proverbs WHERE is_active=true ORDER BY id LIMIT $1",
            args.limit,
        )
    else:
        rows = await conn.fetch(
            "SELECT id, title, category, definition FROM public.daily_proverbs WHERE is_active=true AND topics IS NULL ORDER BY id LIMIT $1",
            args.limit,
        )
    print(f"[fetch] 待標注: {len(rows)} 筆{'（dry-run）' if args.dry_run else ''}")

    # 3. Label one by one
    ok = 0
    for i, row in enumerate(rows, 1):
        print(f"\n[{i}/{len(rows)}] {row['title'][:40]}")
        raw_topics = await analyze_one(client, dict(row))
        if raw_topics is None:
            print("  ✗ 跳過（無結果）")
            continue

        normalized = normalize_topics(raw_topics, proverb_mode=True)
        topic_names = [t["name"] for t in normalized]
        print(f"  → 主題: {', '.join(topic_names)}")

        if args.dry_run:
            ok += 1
            continue

        try:
            await conn.execute(
                "UPDATE public.daily_proverbs SET topics = $1 WHERE id = $2",
                json.dumps(normalized, ensure_ascii=False),
                row["id"],
            )
            ok += 1
        except Exception as e:
            print(f"  ✗ DB update error: {e}")

    await conn.close()
    await client.close()
    print(f"\n✓ {'驗證' if args.dry_run else '完成'} {ok}/{len(rows)} 筆")


if __name__ == "__main__":
    asyncio.run(main())
