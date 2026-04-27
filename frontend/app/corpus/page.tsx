'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Sparkles, Tag, Smile, Meh, Frown, Flame, Zap, Ghost, CloudRain, type LucideIcon } from 'lucide-react'
import { PageLayout } from '@/components/page-layout'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  fetchCorpusTexts,
  fetchCorpusStats,
  type CorpusTextSummary,
  type CorpusTextStats,
} from '@/lib/api'

const GENRES = ['全部', '百科', '諺語集', '文化', '地理', '歷史', '散文', '歌謠', '人物誌']
const DIALECTS = ['全部', '四縣', '海陸', '大埔', '饒平', '詔安', '南四縣']
const TOPICS = ['全部', '飲食', '產業', '生活', '人物', '地理', '民俗', '節慶', '文化', '歌謠', '教育', '觀光', '歷史']

const EMOTION_STYLE: Record<string, { icon: LucideIcon; cls: string }> = {
  '喜悅': { icon: Smile,     cls: 'border-amber-200  text-amber-700  bg-amber-50/70'  },
  '驚訝': { icon: Zap,       cls: 'border-purple-200 text-purple-700 bg-purple-50/70' },
  '生氣': { icon: Flame,     cls: 'border-red-200    text-red-700    bg-red-50/70'    },
  '厭惡': { icon: Frown,     cls: 'border-lime-300   text-lime-800   bg-lime-50/70'   },
  '害怕': { icon: Ghost,     cls: 'border-slate-300  text-slate-700  bg-slate-100/70' },
  '哀傷': { icon: CloudRain, cls: 'border-blue-200   text-blue-700   bg-blue-50/70'   },
  '中性': { icon: Meh,       cls: 'border-gray-200   text-gray-600   bg-gray-50/70'   },
}
const EMOTION_FALLBACK = { icon: Smile, cls: 'border-rose-200 text-rose-700 bg-rose-50/60' }

export default function CorpusListPage() {
  const [items, setItems] = useState<CorpusTextSummary[]>([])
  const [stats, setStats] = useState<CorpusTextStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('全部')
  const [dialect, setDialect] = useState('全部')
  const [topic, setTopic] = useState('全部')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCorpusStats().then(setStats).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchCorpusTexts({
      limit: 50,
      genre: genre === '全部' ? undefined : genre,
      dialect: dialect === '全部' ? undefined : dialect,
      topic: topic === '全部' ? undefined : topic,
      q: search || undefined,
    })
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false))
  }, [genre, dialect, topic, search])

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            文本語料庫
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            收錄客語文章級語料，每篇附 AI 自動分析（主題建模／摘要／實體辨識／情感分析）。
          </p>

          {/* Stats chips */}
          {stats && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm py-1 px-3">
                共 <span className="text-primary font-bold mx-1">{stats.total}</span> 篇
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3">
                <Sparkles className="h-3 w-3 mr-1 text-primary" />
                已分析 <span className="text-primary font-bold mx-1">{stats.analyzed}</span> 篇
              </Badge>
              {stats.by_genre.map((g) => (
                <Badge key={g.genre} variant="secondary" className="text-sm py-1 px-3">
                  {g.genre} · {g.count}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <Input
              type="text"
              placeholder="搜尋標題或內文…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-muted-foreground font-medium mr-1">文類：</span>
              {GENRES.map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={genre === g ? 'default' : 'outline'}
                  onClick={() => setGenre(g)}
                  className="h-7"
                >
                  {g}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-muted-foreground font-medium mr-1">腔調：</span>
              {DIALECTS.map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={dialect === d ? 'default' : 'outline'}
                  onClick={() => setDialect(d)}
                  className="h-7"
                >
                  {d}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-muted-foreground font-medium mr-1">主題：</span>
              {TOPICS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={topic === t ? 'default' : 'outline'}
                  onClick={() => setTopic(t)}
                  className="h-7"
                >
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {loading ? (
          <LoadingState message="載入語料中…" />
        ) : items.length === 0 ? (
          <EmptyState title="沒有符合條件的語料" description="試試調整篩選條件或關鍵字" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/corpus/${encodeURIComponent(item.id)}`} className="block">
                <Card className="h-full transition hover:border-primary hover:shadow-md cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex gap-2 mb-2 flex-wrap items-center">
                      {item.genre && (
                        <Badge variant="outline" className="text-xs">
                          {item.genre}
                        </Badge>
                      )}
                      {item.dialect && (
                        <Badge variant="secondary" className="text-xs">
                          {item.dialect}
                        </Badge>
                      )}
                      {item.word_count != null && (
                        <span className="text-xs text-muted-foreground ml-auto">{item.word_count} 字</span>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-2 line-clamp-1">{item.title}</h3>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                    {item.topics && item.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.topics.slice(0, 3).map((t, idx) => (
                          <Badge key={idx} variant="outline" className="text-[11px] font-normal">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {t.name} {t.percentage}%
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.sentiment && (() => {
                      const top = item.sentiment.distribution
                        ? Object.entries(item.sentiment.distribution)
                            .filter(([, v]) => typeof v === 'number' && v > 0)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 2)
                        : []
                      const primary = item.sentiment.primary
                      if (top.length === 0 && !primary) return null
                      const renderBadge = (emo: string, pct: string | null) => {
                        const style = EMOTION_STYLE[emo] ?? EMOTION_FALLBACK
                        const Icon = style.icon
                        return (
                          <Badge
                            key={emo}
                            variant="outline"
                            className={`text-[11px] font-normal ${style.cls}`}
                          >
                            <Icon className="h-2.5 w-2.5 mr-1" />
                            {emo}{pct ? ` ${pct}` : ''}
                          </Badge>
                        )
                      }
                      return (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {top.length > 0
                            ? top.map(([emo, val]) =>
                                renderBadge(emo, `${Math.round((val as number) * 100)}%`)
                              )
                            : primary && renderBadge(primary, null)}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
