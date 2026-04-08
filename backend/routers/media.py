"""Media router: YouTube search & Bing image search."""

from __future__ import annotations

from fastapi import APIRouter, Query

from external.media_scraper import bing_image_search, youtube_search
from schemas.ai import BingImageResult, YouTubeResult

router = APIRouter(prefix="/api/v1/media", tags=["media"])


@router.get("/youtube", response_model=list[YouTubeResult])
async def youtube_search_endpoint(
    q: str = Query(..., min_length=1, max_length=200, description="搜尋關鍵字"),
    n: int = Query(6, ge=1, le=20, description="結果數量"),
) -> list[YouTubeResult]:
    """Search YouTube for Hakka-related videos."""
    results = await youtube_search(q, n)
    return [YouTubeResult(**r) for r in results]


@router.get("/images", response_model=list[BingImageResult])
async def image_search_endpoint(
    q: str = Query(..., min_length=1, max_length=200, description="搜尋關鍵字"),
    n: int = Query(6, ge=1, le=20, description="結果數量"),
) -> list[BingImageResult]:
    """Search Bing for images."""
    results = await bing_image_search(q, n)
    return [BingImageResult(**r) for r in results]
