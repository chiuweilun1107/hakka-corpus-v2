"""AI service: RAG chat, image recognition, OCR with Gemini + corpus data."""

from __future__ import annotations

import json
import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from external.gemini_client import call_gemini
from external.hakka_api_client import translate
from models.cooc import Cooccurrence
from models.dict import HakkaDict

logger = logging.getLogger(__name__)


def _strip_combining(text: str) -> str:
    """Strip U+20DE / U+20DF combining enclosing marks."""
    return text.replace("\u20de", "").replace("\u20df", "")


async def _lookup_dict(word: str, db: AsyncSession) -> dict | None:
    """Look up a word in hakka_dict, return raw heteronyms data."""
    stmt = select(HakkaDict).where(HakkaDict.title == word)
    result = await db.execute(stmt)
    entry = result.scalars().first()
    if entry:
        return {
            "title": entry.title,
            "heteronyms": entry.heteronyms or [],
        }
    return None


async def _get_cooccurrences(word: str, db: AsyncSession, limit: int = 5) -> list[dict]:
    """Get top cooccurrences for a word, sorted by logdice."""
    stmt = (
        select(Cooccurrence)
        .where(Cooccurrence.word == word)
        .order_by(Cooccurrence.logdice.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        {"word": r.partner, "logdice": float(r.logdice)}
        for r in rows
    ]


# ── RAG Chat ─────────────────────────────────────────────

async def chat_rag(message: str, session_id: str, db: AsyncSession) -> dict:
    """RAG chat: search MoeDict + cooccurrence DB, inject into Gemini context."""
    if not message:
        return {"reply": "請輸入您想詢問的客家文化或客語相關問題。", "source": "系統提示"}

    context_parts: list[str] = []

    # Exact dictionary lookup
    dict_entry = await _lookup_dict(message, db)
    if dict_entry:
        entry_json = json.dumps(dict_entry, ensure_ascii=False)[:800]
        context_parts.append(f"萌典查詢「{message}」：{entry_json}")

    # Fuzzy dictionary lookup (sub-words of length 2-4)
    for length in [4, 3, 2]:
        for i in range(len(message) - length + 1):
            seg = message[i : i + length]
            if seg == message:
                continue
            entry = await _lookup_dict(seg, db)
            if entry:
                pinyin = ""
                definition = ""
                if entry["heteronyms"]:
                    het = entry["heteronyms"][0]
                    pinyin = het.get("pinyin", "")
                    if het.get("definitions"):
                        definition = het["definitions"][0].get("def", "")
                context_parts.append(
                    f"相關詞「{seg}」：拼音={pinyin}，釋義={definition[:100]}"
                )
                if len(context_parts) >= 8:
                    break
        if len(context_parts) >= 8:
            break

    # Cooccurrence lookup
    cooc_results = await _get_cooccurrences(message, db, limit=5)
    if cooc_results:
        top_words = [c["word"] for c in cooc_results]
        context_parts.append(
            f"共現詞資料庫「{message}」的相關詞：{', '.join(top_words)}"
        )

    # Build Gemini prompt
    system_prompt = (
        "你是臺灣客語語料庫的AI助手。你精通客家文化、客語詞彙、歇後語和客家傳統。"
        "請用繁體中文回答，並在適當時候提供客語翻譯和拼音。"
        "回答要簡潔有用，不要過度冗長。"
    )

    rag_context = ""
    if context_parts:
        rag_context = "\n\n【參考資料】\n" + "\n".join(context_parts[:8])
        rag_context = _strip_combining(rag_context)

    full_prompt = f"{system_prompt}{rag_context}\n\n使用者問題：{message}"

    text, err = await call_gemini(full_prompt)
    if err:
        # Fallback: return MoeDict result if Gemini unavailable
        if dict_entry:
            fallback = "（Gemini API 不可用，以下為萌典查詢結果）\n\n"
            if dict_entry.get("heteronyms"):
                for het in dict_entry["heteronyms"]:
                    if het.get("pinyin"):
                        fallback += f"拼音：{het['pinyin']}\n"
                    for defn in het.get("definitions", []):
                        if defn.get("def"):
                            fallback += f"釋義：{defn['def']}\n"
            return {"reply": fallback, "source": "萌典客語辭典（離線模式）"}
        return {"reply": err, "source": "系統提示"}

    # Attach recommendations
    recommendations: list[str] = []
    if cooc_results:
        recommendations = [c["word"] for c in cooc_results[:6]]

    if text:
        text = _strip_combining(text)

    return {
        "reply": text or "",
        "recommendations": recommendations,
        "source": "Gemini AI + 萌典 + 共現詞資料庫（RAG）",
    }


# ── Image Recognition ────────────────────────────────────

async def image_recognize(
    image_b64: str, message: str, db: AsyncSession
) -> dict:
    """Recognize objects in an image with Gemini Vision, translate to Hakka."""
    if not image_b64:
        return {
            "reply": "請上傳一張圖片，系統將辨識圖片內容並翻譯為客語。\n\n支援格式：JPG、PNG、GIF、WebP",
            "source": "系統提示",
        }

    prompt = (
        "辨識這張圖片中的主要物品，列出前5個物品名稱（用繁體中文），"
        "每個物品一行，格式為「1. 物品名」，不要加其他說明文字。"
    )
    if message:
        prompt += f"\n使用者補充說明：{message}"

    text, err = await call_gemini(prompt, image_b64)
    if err:
        return {"reply": err, "source": "系統提示"}

    # Parse item names
    items: list[str] = []
    for line in (text or "").strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        cleaned = re.sub(r"^[\d]+[\.\、\)\]\s]+", "", line).strip()
        if cleaned:
            items.append(cleaned)
    items = items[:5]

    if not items:
        return {
            "reply": f"圖片辨識結果：\n{text}\n\n（未能解析出具體物品名稱）",
            "source": "Gemini Vision API",
        }

    # Translate each item to Hakka (四縣 + 海陸)
    item_results: list[dict] = []
    corpus_results: list[dict] = []

    for item in items:
        hk_text = await translate(item, "hakka_zh_hk")
        hl_text = await translate(item, "hakka_zh_hl")
        hk_pinyin = await translate(hk_text, "hakka_hk_py_tone") if hk_text else ""
        hl_pinyin = await translate(hl_text, "hakka_hl_py_tone") if hl_text else ""

        dialects: list[dict] = []
        if hk_text:
            dialects.append({"label": "四縣腔", "text": hk_text, "pinyin": hk_pinyin})
        if hl_text:
            dialects.append({"label": "海陸腔", "text": hl_text, "pinyin": hl_pinyin})

        item_results.append({"item": item, "dialects": dialects})

        # Corpus lookup
        cooc = await _get_cooccurrences(item, db, limit=5)
        if cooc:
            corpus_results.append(
                {
                    "keyword": item,
                    "cooccurrences": [
                        {"word": c["word"], "logdice": round(c["logdice"], 2)}
                        for c in cooc
                    ],
                }
            )

    source = "Gemini Vision API + 客委會翻譯 API"
    if corpus_results:
        source += " + 臺灣客語語料庫"

    return {
        "reply": f"辨識到 {len(items)} 個物品，以下是客語翻譯：",
        "items": item_results,
        "corpus_results": corpus_results,
        "source": source,
    }


# ── OCR ──────────────────────────────────────────────────

async def ocr_recognize(
    image_b64: str, message: str, db: AsyncSession
) -> dict:
    """OCR text from image, annotate with Hakka pinyin, search corpus."""
    if not image_b64:
        return {
            "reply": "請上傳一張含有文字的圖片，系統將辨識文字內容、標注客語拼音，並檢索相關語料。",
            "source": "系統提示",
        }

    prompt = (
        "辨識這張圖片中的所有文字。"
        "請只輸出辨識到的純文字內容，不要加序號或其他說明。"
        "如果有多行文字，每行一個。"
        "請用繁體中文回答。"
    )
    if message:
        prompt += f"\n使用者補充說明：{message}"

    text, err = await call_gemini(prompt, image_b64)
    if err:
        return {"reply": err, "source": "系統提示"}

    # Extract Chinese words and look up pinyin in MoeDict
    annotations: list[dict] = []
    words_found: set[str] = set()
    recognized_segments: list[str] = []

    cjk_pattern = re.compile(r"^[\u4e00-\u9fff\U00020000-\U0002fa1f]+$")

    for line in (text or "").strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        for length in [4, 3, 2, 1]:
            i = 0
            while i <= len(line) - length:
                segment = line[i : i + length]
                if cjk_pattern.match(segment) and segment not in words_found:
                    entry = await _lookup_dict(segment, db)
                    if entry and entry.get("heteronyms"):
                        for het in entry["heteronyms"]:
                            pinyin_info = het.get("pinyin", "")
                            if pinyin_info:
                                pinyin_info = _strip_combining(pinyin_info)
                                annotations.append(
                                    {"word": segment, "pinyin": pinyin_info}
                                )
                                words_found.add(segment)
                                recognized_segments.append(segment)
                                break
                i += 1

    # Corpus lookup for recognized words
    corpus_results: list[dict] = []
    for seg in recognized_segments[:5]:
        cooc = await _get_cooccurrences(seg, db, limit=5)
        if cooc:
            corpus_results.append(
                {
                    "keyword": seg,
                    "cooccurrences": [
                        {"word": c["word"], "logdice": round(c["logdice"], 2)}
                        for c in cooc
                    ],
                }
            )

    return {
        "reply": "辨識到以下文字，已自動標注客語拼音並檢索語料庫：",
        "ocr_text": text or "",
        "annotations": annotations[:20],
        "corpus_results": corpus_results,
        "source": "Gemini Vision OCR + 萌典客語辭典 + 臺灣客語語料庫",
    }


# ── Auto-detect image type ───────────────────────────────

async def auto_detect_image(image_b64: str) -> str:
    """Use Gemini to determine if image contains text or objects.

    Returns "text" or "object".
    """
    prompt = (
        "請判斷這張圖片的主要內容。"
        "如果圖片主要包含文字（如文件、書本、標示牌、手寫文字），回答「text」。"
        "如果圖片主要包含物品、場景、人物，回答「object」。"
        "只回答 text 或 object 兩個字之一，不要其他文字。"
    )
    text, err = await call_gemini(prompt, image_b64)
    if err:
        return "object"  # default to object recognition

    result = (text or "").strip().lower()
    if "text" in result:
        return "text"
    return "object"
