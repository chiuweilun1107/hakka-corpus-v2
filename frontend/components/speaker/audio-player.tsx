'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src:      string
  duration: number  // 秒（無音檔時作為 display-only）
  accentColor?: string  // 主色（用於播放鈕、進度條）；省略 → 預設白底樣式
  className?: string
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AudioPlayer({ src, duration, accentColor, className }: AudioPlayerProps) {
  const themed = !!accentColor
  // 實心播放鈕：飽和 accent + 白 icon + 兩段陰影
  const btnBg     = themed ? accentColor! : 'rgba(255,255,255,0.9)'
  const btnHover  = themed ? accentColor! : 'rgba(255,255,255,1)'
  const btnShadow = themed
    ? `0 1px 2px ${accentColor}33, 0 4px 12px ${accentColor}40`
    : '0 1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'
  const iconColor = '#ffffff'
  // 進度條：淡 accent 底 + 實 accent 填
  const trackBg   = themed ? `${accentColor}1f` : 'rgba(255,255,255,0.2)'
  const fillBg    = themed ? accentColor!       : 'rgba(255,255,255,0.8)'
  const timerClr  = themed ? 'rgba(100,116,139,0.85)' : 'rgba(255,255,255,0.7)'
  const audioRef          = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)   // 0–100
  const [current, setCurrent]   = useState(0)   // 秒
  const [hasAudio]              = useState(!!src)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setCurrent(0)
  }, [src])

  const toggle = () => {
    const el = audioRef.current
    if (!el || !hasAudio) return
    playing ? el.pause() : el.play()
    setPlaying(!playing)
  }

  const onTimeUpdate = () => {
    const el = audioRef.current
    if (!el) return
    const dur = el.duration || duration
    setCurrent(el.currentTime)
    setProgress(dur > 0 ? (el.currentTime / dur) * 100 : 0)
  }

  const onEnded = () => {
    setPlaying(false)
    setProgress(100)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !hasAudio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    el.currentTime = ratio * (el.duration || duration)
  }

  const displayDuration = audioRef.current?.duration || duration

  return (
    <div className={cn('flex items-center gap-4 select-none', className)}>
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          preload="none"
        />
      )}

      {/* 實心播放鈕：主按鈕階層 */}
      <button
        onClick={toggle}
        disabled={!hasAudio}
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40 transition-transform hover:scale-105 active:scale-95"
        style={{ background: btnBg, boxShadow: btnShadow }}
        onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
        onMouseLeave={e => (e.currentTarget.style.background = btnBg)}
        aria-label={playing ? '暫停' : '播放'}
      >
        {playing
          ? <Pause size={18} fill={iconColor} strokeWidth={0} />
          : <Play  size={18} fill={iconColor} strokeWidth={0} className="translate-x-[1px]" />
        }
      </button>

      {/* 進度條 + 計時器（同行佈局，緊湊俐落） */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-[11px] tabular-nums" style={{ color: timerClr }}>
          {fmt(current)}
        </span>
        <div
          className="flex-1 h-1 rounded-full cursor-pointer overflow-hidden"
          style={{ background: trackBg }}
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${progress}%`, background: fillBg }}
          />
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: timerClr }}>
          {fmt(displayDuration)}
        </span>
      </div>
    </div>
  )
}
