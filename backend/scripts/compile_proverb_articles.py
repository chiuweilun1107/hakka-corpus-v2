#!/usr/bin/env python3
"""
從現有 daily_proverbs 表（541 筆，教育部萌典開放資料）整理成主題式文章級文本。

目的：把零散的諺語組合成「客家諺語主題集」文章，供 AI 分析功能（主題建模/摘要/NER）使用。

授權：daily_proverbs 來源 = 教育部《臺灣客語辭典》，政府開放資料（OGDL 類）

策略：
1. 依關鍵詞分組諺語（飲食、氣候、農耕、人生、家庭等主題）
2. 每個主題串成一篇完整文章（前言 + 諺語列表 + 小結）
3. 輸出為 JSON 到 data/corpus_texts/
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
import asyncpg

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "corpus_texts"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 主題關鍵詞分類
THEMES = {
    "客家飲食諺語集": {
        "keywords": ["食", "飯", "粄", "茶", "酒", "肉", "菜", "糖", "鹹", "甜", "油", "米"],
        "intro": "客家人素以「勤儉」著稱，飲食文化融入日常諺語，反映惜福、儉樸、重禮節之精神。以下集錄客家飲食相關之傳統諺語，展現族群在食物製作、用餐禮儀、以及飲食哲理方面之智慧。",
        "outro": "從以上諺語可看出，客家飲食不只是溫飽，更是族群智慧與生活態度之濃縮。",
    },
    "客家農耕氣候諺語集": {
        "keywords": ["天", "雨", "風", "日", "月", "星", "田", "禾", "耕", "種", "收", "季", "春", "夏", "秋", "冬"],
        "intro": "客家先民多以農為本，長期觀察天時地利，累積豐富的氣候與農耕智慧。這些諺語不僅是生產經驗的總結，更是客家與自然共生哲學的體現。",
        "outro": "客家諺語中的氣候觀察精準細膩，反映先民與土地緊密連結之生活。",
    },
    "客家家庭倫理諺語集": {
        "keywords": ["爺", "姆", "公", "婆", "阿", "兄", "弟", "姊", "妹", "家", "屋", "屋下", "子", "女", "娶", "嫁"],
        "intro": "客家重視家族倫理與長幼有序，諺語中大量反映家庭關係、婚嫁禮俗與子女教育之觀念。透過代代相傳之話語，維繫客家族群堅韌之家庭文化。",
        "outro": "家庭是客家族群之根，諺語中展現對親情、倫理之深厚重視。",
    },
    "客家勤儉人生諺語集": {
        "keywords": ["勤", "儉", "省", "懶", "工", "做", "錢", "富", "窮", "貧", "苦", "甜", "忍", "耐"],
        "intro": "「晴耕雨讀」、「勤儉持家」為客家族群核心精神。諺語中大量描述勤奮工作、節儉持家、以及面對逆境的堅韌態度，構成客家獨特的人生觀。",
        "outro": "客家「硬頸精神」在諺語中展現無遺，是族群文化中最鮮明的一面。",
    },
    "客家動植物諺語集": {
        "keywords": ["牛", "豬", "雞", "鴨", "羊", "狗", "貓", "魚", "鳥", "樹", "花", "草", "竹", "桐"],
        "intro": "客家山區生活與動植物密不可分，諺語中常以動植物比喻人事物，用語生動、想像力豐富，展現客家先民對自然細緻的觀察力。",
        "outro": "自然萬物皆入諺語，體現客家族群細膩之觀察與生活哲學。",
    },
}


def match_theme(proverb_text: str, keywords: list[str]) -> int:
    """計算諺語文字中符合關鍵詞的數量"""
    return sum(1 for kw in keywords if kw in proverb_text)


async def main():
    conn = await asyncpg.connect("postgresql://postgres:postgres@localhost:54322/postgres")
    rows = await conn.fetch("SELECT id, title, pinyin, definition FROM public.daily_proverbs ORDER BY id")
    await conn.close()

    print(f"[load] 從 daily_proverbs 讀取 {len(rows)} 筆諺語")

    articles_out = 0
    for theme_name, config in THEMES.items():
        # 選出符合此主題的諺語
        candidates = []
        for row in rows:
            score = match_theme(row["title"] + (row.get("definition") or ""), config["keywords"])
            if score >= 1:
                candidates.append((score, row))
        candidates.sort(key=lambda x: -x[0])
        picked = [r for _, r in candidates[:30]]  # 每主題最多 30 則

        if len(picked) < 5:
            print(f"  ✗ 跳過 {theme_name}: 只匹配到 {len(picked)} 則")
            continue

        # 組合文章內容
        lines = [config["intro"], ""]
        for i, p in enumerate(picked, 1):
            lines.append(f"【諺語{i}】{p['title']}")
            if p.get("pinyin"):
                lines.append(f"  拼音：{p['pinyin']}")
            if p.get("definition"):
                lines.append(f"  釋義：{p['definition']}")
            lines.append("")
        lines.append(config["outro"])

        content = "\n".join(lines)
        word_count = len(content)

        article = {
            "id": f"proverb_theme_{theme_name}",
            "title": f"《{theme_name}》",
            "content": content,
            "word_count": word_count,
            "dialect": "四縣",
            "genre": "諺語集",
            "source": "教育部《臺灣客語辭典》開放資料（daily_proverbs 主題編彙）",
            "source_url": "https://elearning.hakka.gov.tw/hakka/dictionary",
            "license": "政府資料開放授權",
            "categories": [theme_name.replace("集", ""), "客家諺語"],
            "language_code": "hak",
            "compiled_from": [r["id"] for r in picked],
        }
        safe = theme_name.replace("/", "_")
        fname = OUTPUT_DIR / f"proverb_theme_{safe}.json"
        fname.write_text(json.dumps(article, ensure_ascii=False, indent=2), encoding="utf-8")
        articles_out += 1
        print(f"  ✓ {theme_name}: {len(picked)} 則 → {word_count} 字 → {fname.name}")

    print()
    print(f"✓ 產出 {articles_out} 篇主題諺語集")
    print(f"儲存位置: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
