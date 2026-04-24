'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useTranslations } from 'next-intl'
import { SectionHeader } from '@/components/ui/section-header'

interface NewsItem {
  id: number
  type: string
  title: string
  date: string
}

export function NewsSection() {
  const t = useTranslations('news')
  const newsItems = t.raw('items') as NewsItem[]
  const [activeTab, setActiveTab] = useState('latest')

  const tabs = [
    { id: 'latest', label: t('tabs.latest') },
    { id: 'realtime', label: t('tabs.realtime') },
    { id: 'procurement', label: t('tabs.procurement') },
    { id: 'newsletter', label: t('tabs.newsletter') },
  ]

  return (
    <section className="py-20 bg-background border-t border-border/20">
      <div className="container mx-auto px-4 max-w-4xl">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Tabs：置中 */}
        <div className="flex justify-center mb-6">
          <SegmentedControl
            items={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={activeTab}
            onValueChange={(v) => setActiveTab(v)}
            variant="primary"
            size="md"
          />
        </div>

        {/* List */}
        <div className="divide-y divide-border">
          {newsItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className="flex items-center justify-between py-3 group"
            >
              <span className="text-sm text-foreground/85 truncate pr-4 group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                {item.date}
              </span>
            </a>
          ))}
        </div>

        {/* More */}
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2 font-medium gap-1">
            {t('moreNews')} <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
