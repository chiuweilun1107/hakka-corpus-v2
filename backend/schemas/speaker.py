"""Pydantic schemas for speakers endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SpeakerItem(BaseModel):
    id:             int
    name:           str
    dialect:        str
    region:         str | None = None
    birth_year:     int | None = None
    title:          str | None = None
    bio:            str | None = None
    portrait_url:   str = ""
    audio_url:      str = ""
    audio_duration: int = 0
    media_timestamps: str = ""
    media_script:   str = ""
    video_url:      str = ""
    has_video:      bool = False
    sort_order:     int = 0

    model_config = {"from_attributes": True}


class SpeakerListResponse(BaseModel):
    total: int
    items: list[SpeakerItem] = Field(default_factory=list)
