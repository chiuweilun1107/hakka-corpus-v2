'use client'

import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'
import { useSpeakers } from '@/hooks/use-speakers'
import { SpeakerCarousel } from '@/components/speaker/speaker-carousel'

export function SpeakerProfile() {
  const { speakers, loading, error } = useSpeakers()
  const t = useTranslations('speaker')

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        {loading && (
          <div className="animate-pulse space-y-3 py-4">
            <div className="h-40 w-full rounded-2xl bg-muted" />
            <div className="flex justify-center gap-1.5">
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
          <SpeakerCarousel speakers={speakers} />
        )}
      </div>
    </section>
  )
}
