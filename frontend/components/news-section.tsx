'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const NEWS_ITEMS = [
  { id: 1, type: '最新消息', title: '客家委員會「推展海內外客家事務交流合作活動補助要點」115年度受理公告', date: '115-02-24' },
  { id: 2, type: '即時新聞', title: '舌尖上的客家記憶 越南客家會歡慶天穿日', date: '115-03-31' },
  { id: 3, type: '採購訊息', title: '「客家影像故事」徵件倒數至4/30 總獎金 310 萬元等你來挑戰', date: '115-03-30' },
  { id: 4, type: '電子報', title: '模里西斯中華校友暨青年會慶祝天穿日 傳承文化美', date: '115-03-30' },
]

const TABS = ['最新消息', '即時新聞', '採購訊息', '電子報']

export function NewsSection() {
  const [activeTab, setActiveTab] = useState('最新消息')

  return (
    <section className="py-10 bg-hakka-light-brown">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'text-xs h-8 px-4 rounded-md font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-white text-hakka-light-brown'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y divide-white/10">
            {NEWS_ITEMS.map((item) => (
              <a
                key={item.id}
                href="#"
                className="flex items-center justify-between py-3 group"
              >
                <span className="text-sm text-white/90 truncate pr-4 group-hover:text-white transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-white/40 shrink-0 tabular-nums">
                  {item.date}
                </span>
              </a>
            ))}
          </div>

          {/* More */}
          <div className="mt-3">
            <button className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1 font-medium">
              更多消息 <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
