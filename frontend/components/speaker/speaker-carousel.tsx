'use client'

import { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SpeakerCard } from './speaker-card'
import { DIALECT_CHART_COLORS } from '@/lib/colors'
import type { Speaker } from '@/hooks/use-speakers'

interface SpeakerCarouselProps {
  speakers: Speaker[]
}

export function SpeakerCarousel({ speakers }: SpeakerCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 8000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const autoplay = emblaApi.plugins().autoplay
    if (!autoplay) return
    const onVisibility = () => {
      document.hidden ? autoplay.stop() : autoplay.play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [emblaApi])

  if (speakers.length === 0) return null

  const activeAccent = DIALECT_CHART_COLORS[speakers[selectedIndex]?.dialect] ?? '#009688'

  return (
    <div>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="flex-[0_0_100%] min-w-0">
              <SpeakerCard speaker={speaker} />
            </div>
          ))}
        </div>
      </div>

      {speakers.length > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          {/* 左箭頭 */}
          <button
            onClick={scrollPrev}
            aria-label="上一位講者"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border hover:bg-muted/40 transition-all"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {speakers.map((spk, i) => {
              const dotColor = DIALECT_CHART_COLORS[spk.dialect] ?? '#009688'
              const isActive = i === selectedIndex
              return (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={cn('rounded-full transition-all duration-300', isActive ? 'h-2 w-7' : 'h-1.5 w-1.5')}
                  style={{ background: isActive ? activeAccent : `${dotColor}40` }}
                  aria-label={`第 ${i + 1} 位：${spk.name}`}
                  aria-current={isActive ? 'true' : undefined}
                />
              )
            })}
          </div>

          {/* 計數器 */}
          <span className="text-[11px] font-mono text-muted-foreground/50 tabular-nums whitespace-nowrap text-center">
            {selectedIndex + 1} / {speakers.length}
          </span>

          {/* 右箭頭 */}
          <button
            onClick={scrollNext}
            aria-label="下一位講者"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border hover:bg-muted/40 transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
