"""Gemini API client (text + vision) using httpx async."""

from __future__ import annotations

import logging
import re

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)
TIMEOUT_SECONDS = 30


def _strip_combining_chars(text: str) -> str:
    """Remove Unicode combining enclosing marks (U+20DD-U+20E3)."""
    return re.sub(r"[\u20dd-\u20e3]", "", text)


def _parse_image_base64(raw: str) -> tuple[str, str]:
    """Parse base64 string, stripping data URL prefix if present.

    Returns (pure_base64, mime_type).
    """
    mime_type = "image/jpeg"
    if raw.startswith("data:"):
        header, raw = raw.split(",", 1)
        if "/" in header and ";" in header:
            mime_type = header.split(":")[1].split(";")[0]
    return raw, mime_type


async def call_gemini(
    prompt: str,
    image_base64: str | None = None,
) -> tuple[str | None, str | None]:
    """Call Gemini API (text or vision).

    Args:
        prompt: The text prompt.
        image_base64: Optional base64-encoded image (with or without data URL prefix).

    Returns:
        (result_text, error_message) -- one of the two will be None.
    """
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        return None, "尚未設定 Gemini API Key。"

    url = f"{GEMINI_ENDPOINT}?key={settings.GEMINI_API_KEY}"

    parts: list[dict] = [{"text": prompt}]
    if image_base64:
        b64_data, mime_type = _parse_image_base64(image_base64)
        parts.append(
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": b64_data,
                }
            }
        )

    payload = {"contents": [{"parts": parts}]}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )

        if resp.status_code == 400:
            return None, "Gemini API 請求格式錯誤，請確認圖片格式正確。"
        if resp.status_code == 403:
            return None, "Gemini API Key 無效或權限不足，請檢查 API Key 設定。"
        if resp.status_code == 429:
            return None, "Gemini API 呼叫次數超過限制，請稍後再試。"
        if resp.status_code >= 400:
            logger.error("Gemini HTTP %s: %s", resp.status_code, resp.text[:500])
            return None, f"Gemini API 錯誤 (HTTP {resp.status_code})"

        data = resp.json()
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            text_parts = content.get("parts", [])
            result_text = "".join(p.get("text", "") for p in text_parts)
            result_text = _strip_combining_chars(result_text).strip()
            return result_text, None

        return None, "Gemini API 回傳無結果"

    except httpx.TimeoutException:
        logger.warning("Gemini API timeout after %ss", TIMEOUT_SECONDS)
        return None, "Gemini API 回應逾時，請稍後再試。"
    except Exception as exc:
        logger.exception("Gemini API call failed")
        return None, f"呼叫 Gemini API 失敗：{exc}"
