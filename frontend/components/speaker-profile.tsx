'use client'

import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'
import { useSpeakers } from '@/hooks/use-speakers'
import { SpeakerCarousel } from '@/components/speaker/speaker-carousel'

export function SpeakerProfile() {
  const { speakers, loading, error } = useSpeakers()
  const t = useTranslations('speaker')

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-t border-border/20">
      {/* Section header 有容器限寬，carousel 則全寬 */}
      <div className="container mx-auto px-4 max-w-5xl">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      </div>

      {loading && (
        <div className="animate-pulse px-4 max-w-4xl mx-auto">
          <div className="rounded-3xl overflow-hidden aspect-video grid grid-cols-[42%_58%] bg-muted">
            <div className="bg-muted/60" />
            <div className="bg-card flex flex-col px-8 py-7 gap-4">
              <div className="space-y-1.5">
                <div className="h-7 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="space-y-2 flex-1 pt-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
              <div className="h-10 w-full rounded-xl bg-muted" />
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-muted-foreground py-8">{error}</p>
      )}

      {!loading && !error && (
        <div className="px-4 max-w-4xl mx-auto">
          <SpeakerCarousel speakers={speakers} />
        </div>
      )}
    </section>
  )
}
