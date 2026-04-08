"""YouTube and Bing image scraper using httpx async."""

from __future__ import annotations

import json
import logging
import re
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9",
}
TIMEOUT_SECONDS = 10


async def youtube_search(query: str, n: int = 6) -> list[dict]:
    """Scrape YouTube search results.

    Returns list of dicts with keys: id, title, channel, thumbnail, duration, views.
    """
    encoded = quote(query)
    url = f"https://www.youtube.com/results?search_query={encoded}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=_HEADERS)
            html = resp.text
    except Exception as exc:
        logger.error("YouTube search failed: %s", exc)
        return []

    # Parse ytInitialData JSON
    match = re.search(r"var ytInitialData = ({.*?});</script>", html, re.DOTALL)
    if not match:
        # Fallback: extract video IDs
        ids = list(dict.fromkeys(re.findall(r'"videoId":"([\w-]{11})"', html)))
        return [
            {
                "id": vid,
                "title": "",
                "channel": "",
                "thumbnail": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                "duration": "",
                "views": "",
            }
            for vid in ids[:n]
        ]

    try:
        data = json.loads(match.group(1))
        contents = (
            data["contents"]["twoColumnSearchResultsRenderer"]
            ["primaryContents"]["sectionListRenderer"]
            ["contents"][0]["itemSectionRenderer"]["contents"]
        )
    except (KeyError, IndexError):
        ids = list(dict.fromkeys(re.findall(r'"videoId":"([\w-]{11})"', html)))
        return [
            {
                "id": vid,
                "title": "",
                "channel": "",
                "thumbnail": f"https://img.youtube.com/vi/{vid}/hqdefault.jpg",
                "duration": "",
                "views": "",
            }
            for vid in ids[:n]
        ]

    results: list[dict] = []
    for item in contents:
        vr = item.get("videoRenderer")
        if not vr:
            continue
        vid = vr.get("videoId", "")
        title = vr.get("title", {}).get("runs", [{}])[0].get("text", "")
        channel = vr.get("ownerText", {}).get("runs", [{}])[0].get("text", "")
        # 用標準 YouTube 縮圖 URL，避免簽名參數過期被擋
        thumb = f"https://img.youtube.com/vi/{vid}/hqdefault.jpg"
        duration = vr.get("lengthText", {}).get("simpleText", "")
        views = vr.get("viewCountText", {}).get("simpleText", "")

        results.append(
            {
                "id": vid,
                "title": title,
                "channel": channel,
                "thumbnail": thumb,
                "duration": duration,
                "views": views,
            }
        )
        if len(results) >= n:
            break

    return results


async def bing_image_search(query: str, n: int = 6) -> list[dict]:
    """Scrape Bing image search results.

    Returns list of dicts with keys: thumb, full, title.
    """
    encoded = quote(query)
    url = f"https://www.bing.com/images/search?q={encoded}&form=HDRSC2"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=_HEADERS)
            html = resp.text
    except Exception as exc:
        logger.error("Bing image search failed: %s", exc)
        return []

    # Extract full-resolution URLs from murl field
    thumbs = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', html)
    if not thumbs:
        thumbs = re.findall(r'"murl":"(https?://[^"]+)"', html)

    # Bing thumbnail URLs
    bing_thumbs = re.findall(
        r'src="(https://tse\d+\.mm\.bing\.net/th[^"]+)"', html
    )

    results: list[dict] = []
    for i, full in enumerate(thumbs[:n]):
        thumb = bing_thumbs[i] if i < len(bing_thumbs) else full
        results.append({"thumb": thumb, "full": full, "title": query})

    return results[:n]
