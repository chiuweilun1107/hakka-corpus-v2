"""Seed speakers from official hakka corpus 「口語人物誌」.

來源：https://corpus.hakka.gov.tw/corpus_backend/api/widgets/keymans
資源：由 scripts/download_hakka_speakers.py 下載到 backend/static/speakers/*
Metadata：/tmp/hakka_speakers_meta.json

本腳本會 **清空 speakers 表**再重灌（demo 用，非生產 migration）。
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import engine

META_PATH = Path("/tmp/hakka_speakers_meta.json")


def dialect_of(accent: str) -> str:
    """API 回「四縣腔」，DB 用「四縣」。"""
    return accent.replace("腔", "").strip()


def split_brief(brief: str) -> tuple[str, str]:
    """brief 第一行 → title，剩下 → bio（單行合併）。"""
    lines = [ln.strip() for ln in brief.splitlines() if ln.strip()]
    if not lines:
        return "", ""
    title = lines[0]
    bio = "　".join(lines[1:]) if len(lines) > 1 else ""
    return title, bio


async def seed() -> None:
    if not META_PATH.exists():
        print(f"✗ metadata not found: {META_PATH}")
        print(f"  先跑：python3 backend/scripts/download_hakka_speakers.py")
        sys.exit(1)

    rows = json.loads(META_PATH.read_text())
    print(f"[seed] {len(rows)} speakers from official keymans API")

    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE speakers RESTART IDENTITY CASCADE"))
        print("  ✓ truncated speakers table")

        for i, r in enumerate(rows, 1):
            title, bio = split_brief(r["brief"])
            await conn.execute(
                text("""
                    INSERT INTO speakers
                        (name, dialect, region, birth_year, title, bio,
                         portrait_url, audio_url, audio_duration,
                         media_timestamps, media_script,
                         has_video, sort_order)
                    VALUES
                        (:name, :dialect, NULL, NULL, :title, :bio,
                         :portrait_url, :audio_url, :audio_duration,
                         :media_timestamps, :media_script,
                         false, :sort_order)
                """),
                {
                    "name": r["name"],
                    "dialect": dialect_of(r["accent"]),
                    "title": title,
                    "bio": bio,
                    "portrait_url": r["portrait_local"],
                    "audio_url": r["audio_local"],
                    "audio_duration": r["duration_sec"],
                    "media_timestamps": r["media_timestamps"] or "",
                    "media_script": r["media_script"] or "",
                    "sort_order": i,
                },
            )
            print(f"  [{i:2}] {r['name']} · {dialect_of(r['accent'])} · {r['duration_sec']}s")

    print(f"\n✓ Seeded {len(rows)} speakers (資料來源：客委會臺灣客語語料庫)")


if __name__ == "__main__":
    asyncio.run(seed())
