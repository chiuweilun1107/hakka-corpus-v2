"""Pydantic schemas for AI / translation / media endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ── Chat ─────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = ""
    mode: str = Field(default="chat", description="translate|chat|rag")
    session_id: str = ""
    image: str | None = None  # base64 (may include data URL prefix)


class ChatResponse(BaseModel):
    reply: str
    source: str = ""
    details: list[dict] | None = None
    recommendations: list[str] | None = None
    items: list[dict] | None = None
    corpus_results: list[dict] | None = None
    audio: str | None = None
    examples: list[str] | None = None


# ── Translate ────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class DialectResult(BaseModel):
    dialect: str
    text: str
    pinyin: str


class TranslateResponse(BaseModel):
    original: str
    dialects: list[DialectResult]
    source: str


# ── Image / OCR ──────────────────────────────────────────

class ImageRequest(BaseModel):
    image: str  # base64 (may include data URL prefix)
    message: str = ""


class ImageRecognizeResponse(BaseModel):
    reply: str
    items: list[dict] = Field(default_factory=list)
    corpus_results: list[dict] = Field(default_factory=list)
    source: str


class OcrResponse(BaseModel):
    reply: str
    ocr_text: str = ""
    annotations: list[dict] = Field(default_factory=list)
    corpus_results: list[dict] = Field(default_factory=list)
    source: str


# ── TTS ──────────────────────────────────────────────────

class TtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    voice: str = "hak-xi-TW-vs2-M01"


# ── ASR ──────────────────────────────────────────────────

class AsrTicketResponse(BaseModel):
    wss_url: str


# ── Media ────────────────────────────────────────────────

class YouTubeResult(BaseModel):
    id: str
    title: str = ""
    channel: str = ""
    thumbnail: str = ""
    duration: str = ""
    views: str = ""


class BingImageResult(BaseModel):
    thumb: str
    full: str
    title: str = ""
