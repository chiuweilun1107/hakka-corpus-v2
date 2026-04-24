'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X, Quote } from 'lucide-react'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import { AudioPlayer } from './audio-player'
import type { Speaker } from '@/hooks/use-speakers'

interface VideoModalProps {
  speaker: Speaker
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VideoModal({ speaker, open, onOpenChange }: VideoModalProps) {
  const accentColor = DIALECT_CHART_COLORS[speaker.dialect] ?? '#009688'

  const meta = [
    speaker.region,
    speaker.birth_year ? `b. ${speaker.birth_year}` : null,
  ].filter(Boolean)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">{speaker.name} 訪談影片</Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-[48%_52%] md:aspect-video rounded-2xl overflow-hidden shadow-2xl">

            {/* ── 左欄：影片 ── */}
            <div className="relative aspect-video md:aspect-auto bg-black">
              {open && (
                <iframe
                  src={`${speaker.video_url}?autoplay=1&rel=0&modestbranding=1`}
                  title={speaker.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              )}
            </div>

            {/* ── 右欄：人物資訊 + 口述語音（完整版） ── */}
            <div className="bg-card flex flex-col px-8 py-7 gap-4 overflow-hidden">

              {/* 人物資訊 */}
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
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {speaker.bio}
                  </p>
                )}
              </div>

              {/* 口述語音 */}
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

                {/* 完整字稿（不截斷，可捲動） */}
                {speaker.media_script && (
                  <div className="relative flex-1 min-h-0 overflow-y-auto">
                    <Quote
                      size={24}
                      className="absolute top-0 left-0 pointer-events-none select-none"
                      style={{ color: accentColor, opacity: 0.2 }}
                    />
                    <blockquote
                      className="font-serif text-[17px] leading-[1.9] text-foreground/80 pl-8"
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
            </div>
          </div>

          {/* 關閉按鈕 */}
          <Dialog.Close className="absolute -top-10 right-0 rounded-full p-1.5 text-white/80 hover:text-white transition-colors hover:bg-white/10">
            <X size={20} />
            <span className="sr-only">關閉</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
