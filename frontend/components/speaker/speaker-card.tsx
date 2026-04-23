'use client'

import Image from 'next/image'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import { StaticPortrait } from './static-portrait'
import { AudioPlayer } from './audio-player'
import type { Speaker } from '@/hooks/use-speakers'

interface SpeakerCardProps {
  speaker: Speaker
}

const DIALECT_LABEL: Record<string, string> = {
  '四縣': 'Sî-yen',
  '海陸': 'Hoi-liuk',
  '大埔': 'Thai-pu',
  '饒平': 'Ngiau-phìn',
  '詔安': 'Chau-on',
  '南四縣': 'Nàm Sî-yen',
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  const accentColor = DIALECT_CHART_COLORS[speaker.dialect] ?? '#009688'
  const romanized   = DIALECT_LABEL[speaker.dialect] ?? speaker.dialect

  const meta = [
    speaker.region,
    speaker.birth_year ? `b. ${speaker.birth_year}` : null,
    romanized,
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* 人物資訊 */}
      <div className="flex items-start gap-5">
        <div className="flex-shrink-0">
          {speaker.portrait_url ? (
            <div
              className="w-24 h-24 rounded-full overflow-hidden"
              style={{ boxShadow: `0 0 0 3px ${accentColor}26, 0 4px 12px rgba(0,0,0,0.06)` }}
            >
              <Image
                src={speaker.portrait_url}
                alt={speaker.name}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <StaticPortrait dialect={speaker.dialect} name={speaker.name} size={96} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold leading-tight text-foreground tracking-tight">
              {speaker.name}
            </h3>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold text-white"
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
            <p className="text-[11px] text-muted-foreground/80 font-mono tracking-wide mt-1.5">
              {meta.join(' · ')}
            </p>
          )}

          {speaker.title && (
            <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2 mt-3">
              {speaker.title}
            </p>
          )}

          {speaker.bio && (
            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mt-1.5">
              {speaker.bio}
            </p>
          )}
        </div>
      </div>

      {/* 原文字稿：加大主色條 + 更大字級 + 時間戳移到右上緣 */}
      {speaker.media_script && (
        <figure className="relative">
          {speaker.media_timestamps && (
            <figcaption className="absolute -top-1 right-0 text-[10px] text-muted-foreground/55 font-mono">
              {speaker.media_timestamps}
            </figcaption>
          )}
          <blockquote
            className="text-sm leading-7 text-foreground/85 border-l-[3px] pl-4 line-clamp-3"
            style={{ borderColor: accentColor }}
            dangerouslySetInnerHTML={{ __html: formatScript(speaker.media_script) }}
          />
        </figure>
      )}

      {/* 音訊播放器 */}
      <AudioPlayer
        src={speaker.audio_url}
        duration={speaker.audio_duration}
        accentColor={accentColor}
      />
    </div>
  )
}

/** 把 <CS-zh>...</CS-zh>（華語碼轉）和 <CS-en>...</CS-en>、<SC>..</SC> 標註渲染成斜體半透明 */
function formatScript(s: string): string {
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '§LT§')   // 保護原有 <CS-*>
    .replace(/>/g, '§GT§')
  return escaped
    .replace(/§LT§CS-zh§GT§(.*?)§LT§\/CS-zh§GT§/g, '<i class="text-white/55">$1</i>')
    .replace(/§LT§CS-en§GT§(.*?)§LT§\/CS-en§GT§/g, '<i class="text-white/55">$1</i>')
    .replace(/§LT§CS-ja§GT§(.*?)§LT§\/CS-ja§GT§/g, '<i class="text-white/55">$1</i>')
    .replace(/§LT§SC§GT§(.*?)§LT§\/SC§GT§/g, '<span class="underline decoration-white/30">$1</span>')
    .replace(/§LT§/g, '&lt;')
    .replace(/§GT§/g, '&gt;')
}
