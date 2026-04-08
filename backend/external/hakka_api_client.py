"""Hakka Council API client (translate / TTS / ASR) using httpx async.

API provider: https://speech.hakka.gov.tw
Note: The server has known SSL certificate issues, so we use verify=False.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://speech.hakka.gov.tw"
TIMEOUT_SECONDS = 15
MAX_RETRIES = 2
BACKOFF_BASE = 1.0  # seconds


# ── Dialect mapping table ────────────────────────────────

@dataclass(frozen=True)
class DialectInfo:
    label: str
    zh_code: str       # 華語 → 客語
    py_code: str       # 客語 → 拼音
    tts_voice: str     # TTS voice code


DIALECT_TABLE: list[DialectInfo] = [
    DialectInfo("四縣腔",   "hakka_zh_hk", "hakka_hk_py_tone", "hak-xi-TW-vs2-M01"),
    DialectInfo("海陸腔",   "hakka_zh_hl", "hakka_hl_py_tone", "hak-hl-TW-vs2-M01"),
    DialectInfo("大埔腔",   "hakka_zh_dp", "hakka_dp_py_tone", "hak-dp-TW-vs2-M01"),
    DialectInfo("饒平腔",   "hakka_zh_rp", "hakka_rp_py_tone", "hak-rp-TW-vs2-M01"),
    DialectInfo("南四縣腔", "hakka_zh_ns", "hakka_ns_py_tone", "hak-ns-TW-vs2-M01"),
]


def _get_client() -> httpx.AsyncClient:
    """Create an httpx async client with SSL verification disabled."""
    return httpx.AsyncClient(
        base_url=BASE_URL,
        timeout=TIMEOUT_SECONDS,
        verify=False,
    )


async def _post_with_retry(
    client: httpx.AsyncClient,
    path: str,
    payload: dict,
) -> httpx.Response:
    """POST with exponential backoff retry (max MAX_RETRIES)."""
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = await client.post(
                path,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            return resp
        except (httpx.TimeoutException, httpx.ConnectError) as exc:
            last_exc = exc
            if attempt < MAX_RETRIES:
                wait = BACKOFF_BASE * (2 ** attempt)
                logger.warning(
                    "Hakka API retry %d/%d for %s (wait %.1fs): %s",
                    attempt + 1, MAX_RETRIES, path, wait, exc,
                )
                await asyncio.sleep(wait)
    raise last_exc  # type: ignore[misc]


# ── Translation ──────────────────────────────────────────

async def translate(text: str, code: str) -> str:
    """Call Hakka Council translation API.

    Args:
        text: Source text.
        code: Translation code (e.g. 'hakka_zh_hk', 'hakka_hk_py_tone').

    Returns:
        Translated text, or empty string on failure.
    """
    try:
        async with _get_client() as client:
            resp = await _post_with_retry(
                client,
                "/Translation/Translate",
                {"Code": code, "Before": text},
            )
            data = resp.json()
            if data.get("success"):
                return data.get("message", "")
            return ""
    except Exception as exc:
        logger.error("Hakka translate error (%s): %s", code, exc)
        return ""


# ── TTS ──────────────────────────────────────────────────

async def tts(text: str, voice_code: str = "hak-xi-TW-vs2-M01") -> bytes:
    """Call Hakka Council TTS API.

    Args:
        text: Hakka text to synthesize.
        voice_code: TTS voice code (e.g. 'hak-xi-TW-vs2-M01').

    Returns:
        WAV audio bytes.
    """
    parts = voice_code.split("-")
    lang_code = "-".join(parts[:3])

    payload = {
        "input": {"text": text, "textType": "characters"},
        "voice": {
            "model": "broncitts",
            "languageCode": lang_code,
            "name": voice_code,
        },
        "audioConfig": {"speakingRate": 1},
        "outputConfig": {
            "streamMode": 0,
            "shortPauseDuration": 150,
            "longPauseDuration": 300,
        },
    }

    try:
        async with _get_client() as client:
            resp = await _post_with_retry(client, "/TTS/Synthesize", payload)
            resp.raise_for_status()
            return resp.content
    except Exception as exc:
        logger.error("Hakka TTS error (%s): %s", voice_code, exc)
        raise


# ── ASR ──────────────────────────────────────────────────

async def get_asr_ticket() -> str:
    """Get ASR WebSocket ticket URL.

    Returns:
        wss:// URL string, or empty string on failure.
    """
    try:
        async with _get_client() as client:
            resp = await client.get(
                "/ASR/AccessInfo",
                headers={"Content-Type": "application/json"},
            )
            data = resp.json()
            if data.get("success"):
                return data.get("message", "")
            return ""
    except Exception as exc:
        logger.error("Hakka ASR ticket error: %s", exc)
        return ""
