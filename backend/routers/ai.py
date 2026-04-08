"""AI router: chat, translate, OCR, image recognition, TTS, ASR."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from external.hakka_api_client import get_asr_ticket, tts
from schemas.ai import (
    AsrTicketResponse,
    ChatRequest,
    ChatResponse,
    ImageRequest,
    ImageRecognizeResponse,
    OcrResponse,
    TranslateRequest,
    TranslateResponse,
)
from services.ai_service import (
    auto_detect_image,
    chat_rag,
    image_recognize,
    ocr_recognize,
)
from services.translate_service import translate_all_dialects

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Unified chat endpoint.

    Modes:
    - translate: Chinese → five-dialect Hakka translation
    - chat / rag: RAG-powered chat with corpus context
    - auto: if image is provided, auto-detect and route
    """
    # If image is provided without explicit mode, auto-detect
    if body.image and body.mode == "chat":
        img_type = await auto_detect_image(body.image)
        if img_type == "text":
            result = await ocr_recognize(body.image, body.message, db)
        else:
            result = await image_recognize(body.image, body.message, db)
        return ChatResponse(**result)

    if body.mode == "translate":
        resp = await translate_all_dialects(body.message, db)
        return ChatResponse(
            reply=resp.dialects[0].text if resp.dialects else "無法翻譯此內容。",
            source=resp.source,
            details=[d.model_dump() for d in resp.dialects],
        )

    # Default: RAG chat
    result = await chat_rag(body.message, body.session_id, db)
    return ChatResponse(**result)


@router.post("/translate", response_model=TranslateResponse)
async def translate_endpoint(
    body: TranslateRequest,
    db: AsyncSession = Depends(get_db),
) -> TranslateResponse:
    """Translate Chinese text into all five Hakka dialects."""
    return await translate_all_dialects(body.text, db)


@router.post("/ocr", response_model=OcrResponse)
async def ocr_endpoint(
    body: ImageRequest,
    db: AsyncSession = Depends(get_db),
) -> OcrResponse:
    """OCR: recognize text in image, annotate with Hakka pinyin."""
    result = await ocr_recognize(body.image, body.message, db)
    return OcrResponse(**result)


@router.post("/image-recognize", response_model=ImageRecognizeResponse)
async def image_recognize_endpoint(
    body: ImageRequest,
    db: AsyncSession = Depends(get_db),
) -> ImageRecognizeResponse:
    """Image recognition: identify objects and translate to Hakka."""
    result = await image_recognize(body.image, body.message, db)
    return ImageRecognizeResponse(**result)


@router.get("/tts")
async def tts_endpoint(
    text: str = Query(..., min_length=1, max_length=500, description="要合成的客語文字"),
    voice: str = Query("hak-xi-TW-vs2-M01", description="TTS voice code"),
) -> Response:
    """Text-to-speech: synthesize Hakka speech, return WAV audio."""
    try:
        wav_bytes = await tts(text, voice)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=hakka_tts.wav",
            },
        )
    except Exception as exc:
        logger.error("TTS failed: %s", exc)
        return Response(
            content=b"",
            status_code=502,
            media_type="application/json",
            headers={"Content-Type": "application/json"},
        )


@router.get("/asr/ticket", response_model=AsrTicketResponse)
async def asr_ticket_endpoint() -> AsrTicketResponse | dict:
    """Get ASR WebSocket ticket URL for speech recognition."""
    ticket_url = await get_asr_ticket()
    if ticket_url:
        return AsrTicketResponse(wss_url=ticket_url)
    return {"error_code": "ASR_UNAVAILABLE", "message": "語音辨識服務暫時無法連線，請稍後再試。"}
