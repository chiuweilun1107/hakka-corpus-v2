#!/usr/bin/env python3
"""
對 corpus_texts 表裡每一筆客語文本跑 AI 分析（Gemini Flash）。

分析項目：
1. 摘要（客語 + 華語對照）
2. 主題建模（3-5 主題 + 關鍵詞 + 百分比）
3. NER（人名、地名、組織名）
4. 情感分析（positive/negative/neutral 百分比）

執行：
  python3 backend/scripts/run_ai_analysis.py [--limit N] [--force] [--reanalyze-topics-only]
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

TOPIC_TAXONOMY = UNIFIED_TAXONOMY  # backward-compat alias


ANALYSIS_PROMPT = """你是客語 NLP 分析系統。以下是一篇客語文本，請用 JSON 格式回傳分析結果。

【文本標題】{title}
【文類】{genre}
【腔調】{dialect}
【字數】{word_count}

【文本內容】
{content}

【任務】請分析上述文本，回傳**單一 JSON 物件**（不要包 markdown code block），格式如下：
{{
  "summary_hak": "<用客語（四縣腔）寫的 60-100 字摘要>",
  "summary_zh": "<對應華語摘要 60-100 字>",
  "topics": [
    {{"name": "<必須從下方 12 類清單中擇一>", "percentage": <0-100>, "keywords": ["<原文客語詞1>", "<原文客語詞2>", "<原文客語詞3>"]}},
    ...
  ],
  "ner_entities": {{
    "persons": ["<人名1>", ...],
    "places": ["<地名1>", ...],
    "organizations": ["<組織1>", ...]
  }},
  "emotion": {{
    "primary": "<主要情緒，從 [喜悅, 驚訝, 生氣, 厭惡, 害怕, 哀傷, 中性] 擇一>",
    "distribution": {{
      "喜悅": <0-1>, "驚訝": <0-1>, "生氣": <0-1>,
      "厭惡": <0-1>, "害怕": <0-1>, "哀傷": <0-1>, "中性": <0-1>
    }},
    "sentences": [
      {{"text": "<原文句子>", "keywords": ["<情緒詞1>", "<情緒詞2>"], "emotion": "<情緒標籤>", "confidence": <0-1>}}
    ]
  }}
}}

**規則**：
- **topics.name 必須從下方 16 類固定清單中選出（不可自創名稱、不可組合、不可加修飾詞）**：
  [飲食、文化、教育、觀光、民俗、歷史、人物、地理、產業、生活、節慶、歌謠、勸戒、處世、勤勞、比喻]
  - 選出最貼近本文的 3 個主題，percentage 三者總和須為 100
  - 同一主題不可重複出現
  - 若本文難以歸類（如純技術說明），可使用「文化」或「生活」作兜底
  - 若本文為勸世、警示、人生哲理性質，優先使用「勸戒」或「處世」而非「文化」
- **每個主題的 keywords 必須是「直接從原文擷取的客語詞彙或漢字詞組」**，不可自行生成華語概括詞
- 例如：若原文為客家飲食主題，keywords 應該是「粄條」「擂茶」「鹹豬肉」（原文出現的字詞），不是「勤儉」「誠實」（華語概括詞）
- 每主題列 3-5 個關鍵詞，優先選出現頻率高且具客語/客家文化特色的詞
- **情緒擷取（emotion）規則**：
  - 使用 Ekman 六大情緒 + 中性：喜悅、驚訝、生氣、厭惡、害怕、哀傷、中性
  - distribution 所有值相加約 1.0
  - 若為百科/說明文等情緒中性文本，primary = 中性，distribution 中性值應 > 0.6
  - 若為諺語/文學/歌謠等有情感色彩文本，primary 選最強情緒
  - sentences 選取原文中最有情緒色彩的 3-5 句話，keywords 必須是該句中的客語情緒詞（如「當想你」「無奈」「歡喜」）
- persons/places/organizations 若無則為空陣列，有的話必須是原文出現的實體
- 全部用繁體中文
- 只回傳 JSON，不要任何額外說明文字"""


def extract_json(text: str) -> dict | None:
    """從 Gemini 回應中萃取 JSON（容錯處理 markdown code block）"""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:].strip()
        text = text.rsplit("```", 1)[0].strip()
    # 再找第一個 { 到最後一個 }
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  ⚠ JSON parse error: {e}; raw preview: {text[:200]}")
        return None


async def analyze_one(client: GeminiClient, row: dict) -> dict | None:
    prompt = ANALYSIS_PROMPT.format(
        title=row["title"],
        genre=row.get("genre", "百科"),
        dialect=row.get("dialect", "四縣"),
        word_count=row.get("word_count", 0),
        content=row["content"][:3000],  # 限制長度避免太耗
    )
    try:
        resp = await client.generate_content(prompt, model=Model.BASIC_FLASH)
        return extract_json(resp.text)
    except Exception as e:
        print(f"  ⚠ Gemini error: {e}")
        return None


TOPICS_ONLY_PROMPT = """你是客語 NLP 分析系統。以下是一篇客語文本，請只分析主題並用 JSON 格式回傳。

【文本標題】{title}
【文類】{genre}
【腔調】{dialect}

【文本內容】
{content}

【任務】回傳**單一 JSON 物件**（不要包 markdown code block）：
{{
  "topics": [
    {{"name": "<必須從下方 16 類清單中擇一>", "percentage": <0-100>, "keywords": ["<原文詞1>", "<原文詞2>", "<原文詞3>"]}},
    ...
  ]
}}

**規則**：
- topics.name 必須從 16 類固定清單選出：
  [飲食、文化、教育、觀光、民俗、歷史、人物、地理、產業、生活、節慶、歌謠、勸戒、處世、勤勞、比喻]
- 選最貼近本文的 1-3 個主題，percentage 總和須為 100
- 若本文為勸世、警示性質 → 優先用「勸戒」或「處世」
- 只回傳 JSON，不要任何額外說明文字"""


async def analyze_topics_only(client: GeminiClient, row: dict) -> list | None:
    prompt = TOPICS_ONLY_PROMPT.format(
        title=row["title"],
        genre=row.get("genre", "百科"),
        dialect=row.get("dialect", "四縣"),
        content=row["content"][:2000],
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
    parser.add_argument("--limit", type=int, default=35)
    parser.add_argument("--force", action="store_true", help="重跑已分析過的")
    parser.add_argument("--reanalyze-topics-only", action="store_true", help="只重跑 topics 欄位（不動 summary/NER/emotion）")
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
    if args.reanalyze_topics_only:
        rows = await conn.fetch("SELECT id, title, genre, dialect, content FROM public.corpus_texts ORDER BY id LIMIT $1", args.limit)
        print(f"[fetch] 重分析 topics（16 類）: {len(rows)} 筆")
    elif args.force:
        rows = await conn.fetch("SELECT * FROM public.corpus_texts ORDER BY id LIMIT $1", args.limit)
    else:
        rows = await conn.fetch("SELECT * FROM public.corpus_texts WHERE analysis_updated_at IS NULL ORDER BY id LIMIT $1", args.limit)
    print(f"[fetch] 待分析: {len(rows)} 筆")

    # 3. Analyze one by one
    ok = 0
    for i, row in enumerate(rows, 1):
        print(f"\n[{i}/{len(rows)}] {row['title'][:40]}")

        if args.reanalyze_topics_only:
            raw_topics = await analyze_topics_only(client, dict(row))
            if raw_topics is None:
                print("  ✗ 跳過（無結果）")
                continue
            try:
                await conn.execute(
                    "UPDATE public.corpus_texts SET topics = $1, updated_at = NOW() WHERE id = $2",
                    json.dumps(normalize_topics(raw_topics), ensure_ascii=False),
                    row["id"],
                )
                ok += 1
                topic_names = [t.get("name", "") for t in normalize_topics(raw_topics)][:3]
                print(f"  ✓ 主題: {', '.join(topic_names)}")
            except Exception as e:
                print(f"  ✗ DB update error: {e}")
            continue

        result = await analyze_one(client, dict(row))
        if not result:
            print("  ✗ 跳過（無結果）")
            continue

        try:
            await conn.execute(
                """
                UPDATE public.corpus_texts SET
                    summary = $1,
                    summary_zh = $2,
                    topics = $3,
                    ner_entities = $4,
                    sentiment = $5,
                    analysis_updated_at = NOW(),
                    updated_at = NOW()
                WHERE id = $6
                """,
                result.get("summary_hak"),
                result.get("summary_zh"),
                json.dumps(normalize_topics(result.get("topics", [])), ensure_ascii=False),
                json.dumps(result.get("ner_entities", {}), ensure_ascii=False),
                json.dumps(result.get("emotion", result.get("sentiment", {})), ensure_ascii=False),
                row["id"],
            )
            ok += 1
            topics = normalize_topics(result.get("topics", []))
            topic_names = [t.get("name", "") for t in topics][:3]
            print(f"  ✓ 主題: {', '.join(topic_names)}")
            summary = result.get("summary_hak", "")[:60]
            print(f"  ✓ 摘要: {summary}…")
        except Exception as e:
            print(f"  ✗ DB update error: {e}")

    await conn.close()
    await client.close()
    print(f"\n✓ 完成 {ok}/{len(rows)} 筆")


if __name__ == "__main__":
    asyncio.run(main())
