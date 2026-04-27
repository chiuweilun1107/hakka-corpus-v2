"""Unified topic taxonomy shared between corpus_texts and daily_proverbs batch scripts."""

from __future__ import annotations

CORPUS_TAXONOMY: list[str] = [
    "飲食", "文化", "教育", "觀光", "民俗", "歷史",
    "人物", "地理", "產業", "生活", "節慶", "歌謠",
]

PROVERB_EXTRA: list[str] = ["勸戒", "處世", "勤勞", "比喻"]

UNIFIED_TAXONOMY: list[str] = CORPUS_TAXONOMY + PROVERB_EXTRA

UNIFIED_SET: set[str] = set(UNIFIED_TAXONOMY)

# Substring fallback: if LLM returns a non-canonical name, map it to a canonical one
TOPIC_ALIAS: dict[str, str] = {
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
    # 勸戒
    "勸戒": "勸戒", "告誡": "勸戒", "警告": "勸戒", "警示": "勸戒",
    "命令": "勸戒", "禁止": "勸戒", "勸誡": "勸戒",
    # 處世
    "處世": "處世", "人情": "處世", "智慧": "處世", "觀察": "處世",
    "待人": "處世", "接物": "處世", "處事": "處世",
    # 勤勞
    "勤勞": "勤勞", "努力": "勤勞", "勤奮": "勤勞", "節儉": "勤勞",
    "勤儉": "勤勞", "堅持": "勤勞", "毅力": "勤勞",
    # 比喻
    "比喻": "比喻", "形容": "比喻", "諷刺": "比喻", "借代": "比喻", "歇後語": "比喻",
}

# Default fallback when no alias matches
_DEFAULT_CORPUS_FALLBACK = "文化"
_DEFAULT_PROVERB_FALLBACK = "處世"


def normalize_topic_name(raw: str, proverb_mode: bool = False) -> str:
    """Map an LLM-returned topic name to a canonical taxonomy entry.
    Falls back to 處世 (proverb mode) or 文化 (corpus mode) when no match found.
    """
    raw = raw.strip()
    if raw in UNIFIED_SET:
        return raw
    for alias, target in TOPIC_ALIAS.items():
        if alias in raw:
            return target
    return _DEFAULT_PROVERB_FALLBACK if proverb_mode else _DEFAULT_CORPUS_FALLBACK


def normalize_topics(topics: list, proverb_mode: bool = False) -> list:
    """Normalize a list of topic dicts, merge duplicates, re-scale percentage to 100."""
    if not isinstance(topics, list):
        return []
    merged: dict[str, dict] = {}
    order: list[str] = []
    for t in topics:
        if not isinstance(t, dict):
            continue
        mapped = normalize_topic_name(str(t.get("name", "")), proverb_mode=proverb_mode)
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

    total = sum(merged[n]["percentage"] for n in order)
    if total > 0:
        for n in order:
            merged[n]["percentage"] = round(merged[n]["percentage"] * 100 / total)
        diff = 100 - sum(merged[n]["percentage"] for n in order)
        if diff != 0 and order:
            max_name = max(order, key=lambda n: merged[n]["percentage"])
            merged[max_name]["percentage"] += diff

    return [merged[n] for n in order]
