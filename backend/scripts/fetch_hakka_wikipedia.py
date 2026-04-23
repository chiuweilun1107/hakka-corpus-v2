#!/usr/bin/env python3
"""
抓取 hak.wikipedia.org（客語維基百科）文章級文本。

授權：CC-BY-SA 3.0（可合法重製、散布，需標註來源 + 相同方式分享）

策略：
1. 用 Wikipedia API 列出所有頁面（namespace=0 = 一般文章）
2. 過濾：排除重定向、過短（< 200 字）、過長（> 20000 字）
3. 抓每篇文章的純文字 extract（不含 Wiki 標記）
4. 儲存為 JSON 到 data/corpus_texts/wiki_*.json

執行：
  python3 backend/scripts/fetch_hakka_wikipedia.py --limit 100
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Iterator

import httpx

API_BASE = "https://hak.wikipedia.org/w/api.php"
USER_AGENT = "HakkaCorpusResearch/1.0 (https://github.com/chiuweilun1107/hakka-corpus-v2; research@hamastar.com.tw)"

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "corpus_texts"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def list_all_pages(client: httpx.Client, max_pages: int = 500) -> Iterator[dict]:
    """取最長的頁面（querypage=Longpages，確保抓到實質內容）"""
    params = {
        "action": "query",
        "list": "querypage",
        "qppage": "Longpages",
        "qplimit": 100,
        "format": "json",
    }
    got = 0
    while got < max_pages:
        r = client.get(API_BASE, params=params)
        r.raise_for_status()
        data = r.json()
        results = data.get("query", {}).get("querypage", {}).get("results", [])
        for p in results:
            yield {"pageid": p["page_id"] if "page_id" in p else None, "title": p.get("title", ""), "ns": p.get("ns", 0)}
            got += 1
            if got >= max_pages:
                break
        qc = data.get("query-continue", {}).get("querypage", {})
        if qc:
            params.update(qc)
        else:
            break
        time.sleep(0.3)


def fetch_article(client: httpx.Client, title: str) -> dict | None:
    """用 title 抓單篇文章（Longpages 回傳的 page_id 欄位不一定可靠）"""
    params = {
        "action": "query",
        "titles": title,
        "prop": "extracts|info|categories",
        "explaintext": 1,
        "exsectionformat": "plain",
        "inprop": "url",
        "cllimit": 20,
        "format": "json",
    }
    r = client.get(API_BASE, params=params)
    if r.status_code != 200:
        return None
    data = r.json()
    pages = data.get("query", {}).get("pages", {})
    if not pages:
        return None
    page = next(iter(pages.values()))
    if not page or "extract" not in page:
        return None
    return {
        "wiki_id": page.get("pageid", 0),
        "title": page.get("title", ""),
        "content": page.get("extract", "").strip(),
        "url": page.get("fullurl", ""),
        "categories": [c["title"].replace("Category:", "") for c in page.get("categories", [])],
    }


def infer_genre(title: str, categories: list[str], content: str) -> str:
    """依標題/分類/內容推測文類"""
    cat_str = " ".join(categories).lower()
    title_l = title.lower()

    if any(k in cat_str or k in title_l for k in ["歌曲", "歌謠", "山歌", "詩"]):
        return "歌謠"
    if any(k in cat_str for k in ["人物", "傳記", "家族"]):
        return "人物誌"
    if any(k in cat_str for k in ["地理", "地名", "城市", "鄉鎮", "國家"]):
        return "地理"
    if any(k in cat_str for k in ["歷史", "朝代", "事件"]):
        return "歷史"
    if any(k in cat_str for k in ["文化", "習俗", "節慶", "宗教"]):
        return "文化"
    if any(k in cat_str for k in ["語言", "文字", "文學"]):
        return "語言文學"
    if any(k in cat_str for k in ["飲食", "食物", "料理"]):
        return "飲食"
    if any(k in cat_str for k in ["動物", "植物", "生物"]):
        return "自然"
    return "百科"


def save_article(article: dict, source_dir: Path):
    """儲存為 JSON"""
    data = {
        "id": f"wiki_{article['wiki_id']}",
        "title": article["title"],
        "content": article["content"],
        "word_count": len(article["content"]),
        "dialect": "四縣",  # hak.wikipedia 主要是四縣腔（實際可能混腔，先標這個）
        "genre": infer_genre(article["title"], article["categories"], article["content"]),
        "source": "客語維基百科",
        "source_url": article["url"],
        "license": "CC-BY-SA 3.0",
        "categories": article["categories"],
        "language_code": "hak",
    }
    fname = source_dir / f"wiki_{article['wiki_id']}_{article['title'][:30].replace('/','_')}.json"
    fname.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return fname


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100, help="最多抓幾筆")
    parser.add_argument("--min-words", type=int, default=300)
    parser.add_argument("--max-words", type=int, default=20000)
    args = parser.parse_args()

    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    ok = 0
    skipped_short = 0
    skipped_long = 0
    errors = 0

    print(f"[fetch] 從 hak.wikipedia.org 抓前 {args.limit * 3} 個頁面中符合長度 ({args.min_words}-{args.max_words} 字) 的 {args.limit} 筆")
    print(f"[output] {OUTPUT_DIR}")

    with httpx.Client(headers=headers, timeout=30.0) as client:
        for i, page_meta in enumerate(list_all_pages(client, max_pages=args.limit * 3)):
            if ok >= args.limit:
                break
            try:
                article = fetch_article(client, page_meta["title"])
                if not article:
                    errors += 1
                    continue
                wc = len(article["content"])
                if wc < args.min_words:
                    skipped_short += 1
                    continue
                if wc > args.max_words:
                    skipped_long += 1
                    continue

                fname = save_article(article, OUTPUT_DIR)
                ok += 1
                print(f"[{ok:3d}/{args.limit}] {article['title']:30} ({wc:5d}字) → {fname.name}", flush=True)
                time.sleep(0.3)
            except Exception as e:
                print(f"  ERROR on {page_meta.get('title','?')}: {e}", flush=True)
                errors += 1

    print()
    print(f"✓ 成功: {ok} 筆")
    print(f"✗ 過短: {skipped_short} 筆 (< {args.min_words} 字)")
    print(f"✗ 過長: {skipped_long} 筆 (> {args.max_words} 字)")
    print(f"✗ 錯誤: {errors} 筆")
    print(f"儲存位置: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
