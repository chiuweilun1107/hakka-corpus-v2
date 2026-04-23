#!/usr/bin/env python3
"""
對 corpus_texts 表裡每一筆客語文本跑 AI 分析（Gemini Flash）。

分析項目：
1. 摘要（客語 + 華語對照）
2. 主題建模（3-5 主題 + 關鍵詞 + 百分比）
3. NER（人名、地名、組織名）
4. 情感分析（positive/negative/neutral 百分比）

執行：
  python3 backend/scripts/run_ai_analysis.py [--limit N] [--force]
"""

from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

import asyncpg
from gemini_webapi import GeminiClient
from gemini_webapi.constants import Model

DATABASE_URL = "postgresql://postgres:postgres@localhost:54322/postgres"
STORAGE_STATE = Path.home() / ".notebooklm" / "storage_state.json"


# 固定主題分類 taxonomy — 12 類，與首頁 stats 圖表的 5 大主題（飲食/文化/教育/觀光/民俗）共用詞彙
TOPIC_TAXONOMY = [
    "飲食", "文化", "教育", "觀光", "民俗", "歷史",
    "人物", "地理", "產業", "生活", "節慶", "歌謠",
]


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
- **topics.name 必須從下方 12 類固定清單中選出（不可自創名稱、不可組合、不可加修飾詞）**：
  [飲食、文化、教育、觀光、民俗、歷史、人物、地理、產業、生活、節慶、歌謠]
  - 選出最貼近本文的 3 個主題，percentage 三者總和須為 100
  - 同一主題不可重複出現
  - 若本文難以歸類（如純技術說明），可使用「文化」或「生活」作兜底
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


# Gemini 偶爾不守清單時的兜底映射（子字串 → 規範類別）
_TOPIC_ALIAS: dict[str, str] = {
    # 飲食
    "飲食": "飲食", "食物": "飲食", "料理": "飲食", "小吃": "飲食", "美食": "飲食",
    # 文化（通用兜底）
    "文化": "文化", "藝術": "文化", "傳統": "文化", "風俗": "文化",
    # 教育
    "教育": "教育", "學校": "教育", "學習": "教育", "教學": "教育",
    # 觀光
    "觀光": "觀光", "旅遊": "觀光", "景點": "觀光",
    # 民俗
    "民俗": "民俗", "信仰": "民俗", "宗教": "民俗", "祭祀": "民俗", "禮俗": "民俗",
    # 歷史
    "歷史": "歷史", "沿革": "歷史", "大事": "歷史", "年表": "歷史",
    # 人物
    "人物": "人物", "人名": "人物", "名人": "人物", "傳記": "人物",
    "生平": "人物", "背景": "人物", "經歷": "人物", "求學": "人物",
    "從政": "人物", "政治人物": "人物", "家族": "人物", "血統": "人物",
    # 地理
    "地理": "地理", "地名": "地理", "地區": "地理", "地形": "地理", "地貌": "地理",
    # 產業
    "產業": "產業", "農業": "產業", "工業": "產業", "商業": "產業", "經濟": "產業",
    "交通": "產業", "技術": "產業", "科技": "產業", "設備": "產業",
    # 生活
    "生活": "生活", "家庭": "生活", "日常": "生活", "倫理": "生活",
    # 節慶
    "節慶": "節慶", "節日": "節慶", "慶典": "節慶",
    # 歌謠
    "歌謠": "歌謠", "山歌": "歌謠", "歌詞": "歌謠", "音樂": "歌謠",
}
TOPIC_SET = set(TOPIC_TAXONOMY)


def normalize_topics(topics: list) -> list:
    """把 Gemini 回傳的主題 name 規範化到 12 類清單；
    - 無法映射的退到『文化』兜底
    - 映射後重複的 name 會累加 percentage 並合併 keywords（保留順序）
    - 最後把 percentage 標準化到總和 100
    """
    if not isinstance(topics, list):
        return []
    merged: dict[str, dict] = {}
    order: list[str] = []
    for t in topics:
        if not isinstance(t, dict):
            continue
        raw = str(t.get("name", "")).strip()
        mapped: str | None = None
        if raw in TOPIC_SET:
            mapped = raw
        else:
            for alias, target in _TOPIC_ALIAS.items():
                if alias in raw:
                    mapped = target
                    break
        if mapped is None:
            mapped = "文化"

        pct_raw = t.get("percentage", 0)
        try:
            pct = float(pct_raw) if pct_raw is not None else 0.0
        except (TypeError, ValueError):
            pct = 0.0
        kw = t.get("keywords", []) or []

        if mapped not in merged:
            merged[mapped] = {"name": mapped, "percentage": pct, "keywords": list(kw)}
            order.append(mapped)
        else:
            merged[mapped]["percentage"] += pct
            for k in kw:
                if k not in merged[mapped]["keywords"]:
                    merged[mapped]["keywords"].append(k)

    # 標準化 percentage 總和 → 100
    total = sum(merged[n]["percentage"] for n in order)
    if total > 0:
        for n in order:
            merged[n]["percentage"] = round(merged[n]["percentage"] * 100 / total)
        # 修正捨入誤差：最大那筆吸收餘差
        diff = 100 - sum(merged[n]["percentage"] for n in order)
        if diff != 0 and order:
            max_name = max(order, key=lambda n: merged[n]["percentage"])
            merged[max_name]["percentage"] += diff

    return [merged[n] for n in order]


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


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=35)
    parser.add_argument("--force", action="store_true", help="重跑已分析過的")
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
        rows = await conn.fetch("SELECT * FROM public.corpus_texts ORDER BY id LIMIT $1", args.limit)
    else:
        rows = await conn.fetch("SELECT * FROM public.corpus_texts WHERE analysis_updated_at IS NULL ORDER BY id LIMIT $1", args.limit)
    print(f"[fetch] 待分析: {len(rows)} 筆")

    # 3. Analyze one by one
    ok = 0
    for i, row in enumerate(rows, 1):
        print(f"\n[{i}/{len(rows)}] {row['title'][:40]}")
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
