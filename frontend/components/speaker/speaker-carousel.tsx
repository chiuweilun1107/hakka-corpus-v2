'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { SpeakerCard } from './speaker-card'
import type { Speaker } from '@/hooks/use-speakers'

interface SpeakerCarouselProps {
  speakers: Speaker[]
}

export function SpeakerCarousel({ speakers }: SpeakerCarouselProps) {
  const t = useTranslations('a11y')
  const [index, setIndex] = useState(0)

  if (speakers.length === 0) return null

  const prev = () => setIndex(i => (i - 1 + speakers.length) % speakers.length)
  const next = () => setIndex(i => (i + 1) % speakers.length)

  return (
    <div className="relative">
      {/* 主卡片 */}
      <SpeakerCard speaker={speakers[index]} />

      {/* 左右切換 */}
      {speakers.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.12)] hover:-translate-x-0.5 hover:-translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            aria-label={t('prevSpeaker')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background shadow-[0_1px_2px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.12)] hover:translate-x-0.5 hover:-translate-y-1/2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            aria-label={t('nextSpeaker')}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot pagination */}
      {speakers.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {speakers.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'bg-primary w-6' : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50',
              )}
              aria-label={`第 ${i + 1} 位`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
