'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { FESTIVALS } from '@/lib/data/festivals'
import { cn } from '@/lib/utils'

export function FestivalCards() {
  const t = useTranslations('festivalCards')
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FESTIVALS.map((f) => (
            <Link href={`/festivals/${f.slug}`} key={f.slug}>
              <Card
                className={cn(
                  'group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0',
                  f.color
                )}
              >
                <CardContent className="p-5 space-y-2">
                  <div
                    aria-label={f.iconLabel}
                    className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center text-lg font-bold text-foreground/70"
                  >
                    {f.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold group-hover:text-primary transition-colors">{f.name}</h3>
                    <p className="text-xs text-muted-foreground">{f.date}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{f.tagline}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
