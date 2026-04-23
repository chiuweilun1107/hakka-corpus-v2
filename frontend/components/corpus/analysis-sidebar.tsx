'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Sparkles, Tag, Heart, User, MapPin, Building2, Search, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { EntityType } from '@/components/corpus/original-reader'
import type { CorpusTextDetail } from '@/lib/api'

interface AnalysisSidebarProps {
  data: CorpusTextDetail
  onHighlight: (words: string[], type: EntityType) => void
  onClearHighlight: () => void
  activeHighlight: { words: string[]; type: EntityType } | null
}

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          className="flex items-center justify-between w-full text-left group"
          onClick={() => setOpen(!open)}
        >
          <CardTitle className="text-sm flex items-center gap-2 group-hover:text-primary">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </CardHeader>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )
}

export function AnalysisSidebar({ data, onHighlight, onClearHighlight, activeHighlight }: AnalysisSidebarProps) {
  const topics = data.topics || []
  const ner = data.ner_entities || {}
  const persons = ner.persons || []
  const places = ner.places || []
  const organizations = ner.organizations || []

  const isActive = (words: string[], type: EntityType) =>
    activeHighlight?.type === type && activeHighlight.words.join('|') === words.join('|')

  return (
    <div className="space-y-3">
      {/* 主題 */}
      {topics.length > 0 && (
        <Section title={`主題分析 (${topics.length})`} icon={Tag}>
          <div className="space-y-3">
            {topics.map((t, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1.5">
                  <strong className="text-sm text-foreground">{t.name}</strong>
                  <span className="text-primary font-semibold text-xs">{t.percentage}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {t.keywords.map((k, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        isActive([k], 'keyword')
                          ? onClearHighlight()
                          : onHighlight([k], 'keyword')
                      }
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-full border transition',
                        isActive([k], 'keyword')
                          ? 'bg-yellow-200 text-yellow-900 border-yellow-300'
                          : 'bg-background text-foreground/70 border-border hover:border-primary hover:text-primary',
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 摘要 */}
      {data.summary && (
        <Section title="AI 自動摘要" icon={Sparkles}>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                客語摘要（{data.dialect || '四縣'}腔）
              </div>
              <p className="text-sm text-foreground leading-relaxed">{data.summary}</p>
            </div>
            {data.summary_zh && (
              <div className="pt-2 border-t border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  對應華語
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{data.summary_zh}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* NER */}
      {(persons.length + places.length + organizations.length > 0) && (
        <Section title="實體辨識" icon={User}>
          <div className="space-y-3">
            {[
              { key: 'person' as EntityType, label: '人名', icon: User, items: persons, cls: 'text-amber-700 dark:text-amber-300' },
              { key: 'place' as EntityType, label: '地名', icon: MapPin, items: places, cls: 'text-sky-700 dark:text-sky-300' },
              { key: 'organization' as EntityType, label: '組織', icon: Building2, items: organizations, cls: 'text-emerald-700 dark:text-emerald-300' },
            ].map(({ key, label, icon: Icon, items, cls }) => (
              <div key={key}>
                <div className={cn('text-xs font-semibold mb-1.5 flex items-center gap-1', cls)}>
                  <Icon className="h-3 w-3" />
                  {label}（{items.length}）
                </div>
                {items.length === 0 ? (
                  <div className="text-xs text-muted-foreground pl-4">—</div>
                ) : (
                  <div className="flex flex-wrap gap-1 pl-4">
                    {items.map((e, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          isActive([e], key) ? onClearHighlight() : onHighlight([e], key)
                        }
                        className={cn(
                          'text-[11px] px-2 py-0.5 rounded border transition',
                          isActive([e], key)
                            ? cn('border-current font-semibold', cls)
                            : 'border-border text-foreground/70 hover:border-primary',
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 情緒擷取 */}
      {data.sentiment && (data.sentiment.distribution || data.sentiment.sentences) && (
        <Section title="情緒擷取" icon={Heart}>
          <div className="space-y-4">
            {/* 主要情緒 */}
            {data.sentiment.primary && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">主要情緒</span>
                <span className="text-sm font-semibold text-primary">{data.sentiment.primary}</span>
              </div>
            )}

            {/* 七大情緒分布 */}
            {data.sentiment.distribution && (
              <div className="space-y-1.5">
                {(() => {
                  const emotionOrder = ['喜悅', '驚訝', '生氣', '厭惡', '害怕', '哀傷', '中性']
                  const colorMap: Record<string, string> = {
                    喜悅: 'bg-amber-400',
                    驚訝: 'bg-violet-400',
                    生氣: 'bg-rose-500',
                    厭惡: 'bg-green-600',
                    害怕: 'bg-slate-500',
                    哀傷: 'bg-sky-500',
                    中性: 'bg-stone-400',
                  }
                  return emotionOrder.map((emo) => {
                    const val = data.sentiment!.distribution![emo] ?? 0
                    if (val < 0.03) return null
                    const pct = (val * 100).toFixed(0)
                    return (
                      <div key={emo}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-foreground">{emo}</span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', colorMap[emo] || 'bg-muted-foreground')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}

            {/* 逐句樣本 */}
            {data.sentiment.sentences && data.sentiment.sentences.length > 0 && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  代表句子（{data.sentiment.sentences.length}）
                </div>
                {data.sentiment.sentences.map((s, i) => (
                  <div key={i} className="bg-muted/40 rounded-md p-2 text-xs space-y-1">
                    <div className="text-foreground leading-relaxed">「{s.text}」</div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {s.emotion}
                      </Badge>
                      <span className="text-muted-foreground">
                        信心度 {(s.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {s.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.keywords.map((k, ki) => (
                          <button
                            key={ki}
                            onClick={() =>
                              isActive([k], 'keyword')
                                ? onClearHighlight()
                                : onHighlight([k], 'keyword')
                            }
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded border transition',
                              isActive([k], 'keyword')
                                ? 'bg-yellow-200 text-yellow-900 border-yellow-300'
                                : 'bg-background text-foreground/70 border-border hover:border-primary',
                            )}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 舊結構 fallback */}
            {!data.sentiment.distribution && !data.sentiment.sentences && (
              <div className="space-y-1.5">
                {[
                  { key: 'positive', label: '正向', cls: 'bg-emerald-500' },
                  { key: 'neutral', label: '中性', cls: 'bg-amber-500' },
                  { key: 'negative', label: '負向', cls: 'bg-rose-500' },
                ].map((s) => {
                  const val = (data.sentiment as any)?.[s.key] ?? 0
                  const pct = (val * 100).toFixed(0)
                  return (
                    <div key={s.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-foreground">{s.label}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', s.cls)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 延伸功能 */}
      <Section title="延伸分析" icon={BookOpen} defaultOpen={false}>
        <div className="space-y-2 text-sm">
          <Link href={`/cooccurrence?q=${encodeURIComponent(data.title)}`} className="block">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Search className="h-3.5 w-3.5 mr-2" />
              查標題共現詞
            </Button>
          </Link>
          <Link href={`/sketch?q=${encodeURIComponent(data.title)}`} className="block">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <BookOpen className="h-3.5 w-3.5 mr-2" />
              Word Sketch 分析
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  )
}
