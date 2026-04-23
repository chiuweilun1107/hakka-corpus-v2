"""一次性：從 corpus.hakka.gov.tw 官方首頁抓 10 位口語人物誌發音人的
頭像/音檔/簡介/文字稿，下載到 backend/static/speakers/ 本地。

跑完會產出：
  - backend/static/speakers/portraits/{id}.(jpg|png)
  - backend/static/speakers/audio/{id}.mp3
  - /tmp/hakka_speakers_meta.json — 給 seed_speakers.py 使用

用法：
  python3 backend/scripts/download_hakka_speakers.py
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse, unquote

API = "https://corpus.hakka.gov.tw/corpus_backend/api/widgets/keymans"
ROOT = Path(__file__).resolve().parent.parent
PORTRAIT_DIR = ROOT / "static" / "speakers" / "portraits"
AUDIO_DIR = ROOT / "static" / "speakers" / "audio"
META_OUT = Path("/tmp/hakka_speakers_meta.json")

# 從時間戳字串 (HH:MM:SS-HH:MM:SS) 算秒數
TIME_RE = re.compile(r"\((\d{2}):(\d{2}):(\d{2})-(\d{2}):(\d{2}):(\d{2})\)")


def ts_to_duration(ts: str) -> int:
    m = TIME_RE.search(ts or "")
    if not m:
        return 0
    h1, m1, s1, h2, m2, s2 = [int(x) for x in m.groups()]
    return (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1)


def fetch_json(url: str) -> dict:
    out = subprocess.check_output(["curl", "-sSL", url], timeout=30)
    return json.loads(out.decode("utf-8"))


def download(url: str, dest: Path) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(["curl", "-sSL", "-o", str(dest), url], timeout=120)
    return dest.stat().st_size


def ext_of(url: str, default: str = ".jpg") -> str:
    path = urlparse(url).path
    name = unquote(path.rsplit("/", 1)[-1])
    m = re.search(r"(\.[A-Za-z0-9]{2,5})$", name)
    return m.group(1).lower() if m else default


def main() -> None:
    PORTRAIT_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print(f"[fetch] {API}")
    data = fetch_json(API)
    rows = data["results"]
    print(f"  -> {len(rows)} speakers")

    meta = []
    for i, r in enumerate(rows, 1):
        sid = r["id"]
        # portrait
        photo = r["photo"]
        p_ext = ext_of(photo, ".jpg")
        p_path = PORTRAIT_DIR / f"{sid}{p_ext}"
        try:
            size = download(photo, p_path)
            print(f"  [{i}/{len(rows)}] {r['name']} 頭像 {p_path.name} ({size // 1024}KB)")
        except Exception as e:
            print(f"  ! 頭像失敗 {r['name']}: {e}")
            p_path = None

        # audio — 固定 .mp3
        audio = r["media_link"]
        a_path = AUDIO_DIR / f"{sid}.mp3"
        try:
            size = download(audio, a_path)
            print(f"             音檔 {a_path.name} ({size // 1024}KB)")
        except Exception as e:
            print(f"  ! 音檔失敗 {r['name']}: {e}")
            a_path = None

        meta.append({
            "id": sid,
            "name": r["name"],
            "accent": r["accent"],
            "brief": r["brief"],
            "media_timestamps": r["media_timestamps"],
            "media_script": r["media_script"],
            "portrait_local": f"/static/speakers/portraits/{p_path.name}" if p_path else "",
            "audio_local": f"/static/speakers/audio/{a_path.name}" if a_path else "",
            "duration_sec": ts_to_duration(r["media_timestamps"]),
        })

    META_OUT.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"\n[done] metadata → {META_OUT}")


if __name__ == "__main__":
    main()
