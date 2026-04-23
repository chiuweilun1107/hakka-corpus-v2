"""Speaker ORM model — oral corpus informants / narrators."""

from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, Integer, SmallInteger, Text, func

from models.base import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id           = Column(Integer, primary_key=True)
    name         = Column(Text, nullable=False)
    dialect      = Column(Text, nullable=False)        # 四縣/海陸/大埔/饒平/詔安/南四縣
    region       = Column(Text)                        # e.g. 苗栗頭份
    birth_year   = Column(SmallInteger)                # 空 → 早期珍貴語料
    title        = Column(Text)                        # 展示標題
    bio          = Column(Text)                        # 簡介（中文）
    portrait_url = Column(Text, server_default="")     # 空 → 前端靜態畫面 fallback
    audio_url    = Column(Text, server_default="")     # mp3/ogg 相對路徑
    audio_duration = Column(Integer, server_default="0")  # 秒數
    media_timestamps = Column(Text, server_default="")     # 原音檔片段時間戳 "(00:22:01-00:22:50)"
    media_script = Column(Text, server_default="")         # 原文字稿（客語，含 <CS-zh> 標記）
    has_video    = Column(Boolean, nullable=False, server_default="false")
    sort_order   = Column(SmallInteger, nullable=False, server_default="0")
    is_active    = Column(Boolean, nullable=False, server_default="true")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
