'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Quote } from 'lucide-react'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import { StaticPortrait } from './static-portrait'
import { AudioPlayer } from './audio-player'
import { VideoModal } from './video-modal'
import type { Speaker } from '@/hooks/use-speakers'

export function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const [videoOpen, setVideoOpen] = useState(false)
  const accentColor = DIALECT_CHART_COLORS[speaker.dialect] ?? '#009688'

  const meta = [
    speaker.region,
    speaker.birth_year ? `b. ${speaker.birth_year}` : null,
  ].filter(Boolean)

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-[42%_58%] md:aspect-video rounded-3xl overflow-hidden">

      {/* ── 左欄：圖片 > 靜態畫面 ── */}
      <div className="relative aspect-[4/3] md:aspect-auto bg-black">
        {speaker.portrait_url ? (
          <Image
            src={speaker.portrait_url}
            alt={speaker.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 42vw"
          />
        ) : (
          <StaticPortrait dialect={speaker.dialect} name={speaker.name} variant="panel" />
        )}
      </div>

      {/* ── 右欄：Script Panel ── */}
      <div className="bg-card flex flex-col px-8 py-7 gap-4">

        {/* ① 人物資訊：名字 + 腔調 badge + 珍貴語音 + meta + title + bio */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-2xl font-bold text-foreground tracking-tight leading-tight">
              {speaker.name}
            </h3>
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold text-white"
              style={{ background: accentColor }}
            >
              {speaker.dialect}
            </span>
            {!speaker.has_video && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                珍貴語音
              </span>
            )}
          </div>

          {meta.length > 0 && (
            <p className="text-[11px] text-muted-foreground/70 font-mono tracking-wide">
              {meta.join(' · ')}
            </p>
          )}

          {speaker.title && (
            <p className="text-sm font-semibold leading-snug" style={{ color: accentColor }}>
              {speaker.title}
            </p>
          )}

          {speaker.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {speaker.bio}
            </p>
          )}
        </div>

        {/* ② 口述語音：eyebrow + 字稿 + 播放器（三者一組） */}
        <div
          className="flex flex-col gap-3 flex-1 min-h-0 pt-3"
          style={{ borderTop: `1px solid ${accentColor}25` }}
        >
          {/* Eyebrow */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full" style={{ background: accentColor }} />
              <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                口述語音
              </span>
            </div>
            {speaker.media_timestamps && (
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {speaker.media_timestamps}
              </span>
            )}
          </div>

          {/* 字稿 */}
          {speaker.media_script && (
            <div className="relative flex-1 min-h-0">
              <Quote
                size={24}
                className="absolute top-0 left-0 pointer-events-none select-none"
                style={{ color: accentColor, opacity: 0.2 }}
              />
              <blockquote
                className="font-serif text-[17px] leading-[1.9] text-foreground/80 line-clamp-5 pl-8"
                dangerouslySetInnerHTML={{ __html: formatScript(speaker.media_script) }}
              />
            </div>
          )}

          {/* 播放器 */}
          <div className="flex-shrink-0 mt-auto pt-3 border-t border-border/40">
            <AudioPlayer
              src={speaker.audio_url}
              duration={speaker.audio_duration}
              accentColor={accentColor}
            />
          </div>
        </div>

        {/* 影像按鈕（僅有影片者顯示） */}
        {speaker.has_video && speaker.video_url && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setVideoOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
              style={{ background: accentColor }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="3,1 13,7 3,13" />
              </svg>
              觀看訪談影片
            </button>
          </div>
        )}
      </div>
    </div>

    {speaker.has_video && speaker.video_url && (
      <VideoModal
        speaker={speaker}
        open={videoOpen}
        onOpenChange={setVideoOpen}
      />
    )}
    </>
  )
}

function formatScript(s: string): string {
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '§LT§')
    .replace(/>/g, '§GT§')
  return escaped
    .replace(/§LT§CS-zh§GT§(.*?)§LT§\/CS-zh§GT§/g, '<i class="text-foreground/45">$1</i>')
    .replace(/§LT§CS-en§GT§(.*?)§LT§\/CS-en§GT§/g, '<i class="text-foreground/45">$1</i>')
    .replace(/§LT§CS-ja§GT§(.*?)§LT§\/CS-ja§GT§/g, '<i class="text-foreground/45">$1</i>')
    .replace(/§LT§SC§GT§(.*?)§LT§\/SC§GT§/g, '<span class="underline decoration-foreground/25">$1</span>')
    .replace(/§LT§/g, '&lt;')
    .replace(/§GT§/g, '&gt;')
}
