'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { PageLayout } from '@/components/page-layout'
import { CertifiedBadge, GradeBadge, InlineWordGrade, TagPill } from '@/components/ui/grade-badge'
import {
  fetchProverbById,
  fetchProverbPinyinByDialect,
  fetchCorpusTexts,
} from '@/lib/api'
import type { ProverbItem, PinyinByDialect, CorpusTextSummary } from '@/lib/api'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DialectPinyinSwitcher } from '@/components/ui/dialect-pinyin-switcher'
import { labelFromDialect } from '@/lib/dialect'
import { ContentCard } from '@/components/ui/content-card'
import { LabeledDivider } from '@/components/ui/labeled-divider'
import { BackLink } from '@/components/ui/back-link'
import { SectionHeader } from '@/components/ui/section-header'
import { PinyinText } from '@/components/ui/pinyin-text'
import { CJK_REGEX } from '@/lib/text'
import { useVocabGrades } from '@/lib/hooks/use-vocab-grades'

export default function ExampleDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const { activeDialect, setActiveDialect } = useExploreStore()

  const [proverb, setProverb] = useState<ProverbItem | null>(null)
  const [pinyinByDialect, setPinyinByDialect] = useState<PinyinByDialect[]>([])
  const [corpusItems, setCorpusItems] = useState<CorpusTextSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // vocab grade cache（shared across pages via Zustand store）
  const titleChars = proverb ? [...proverb.title].filter(c => CJK_REGEX.test(c)) : []
  const dialectLabel = activeDialect ? labelFromDialect(activeDialect) : undefined
  const { gradeMap, highestGrade, loaded: gradeLoaded } = useVocabGrades(titleChars, dialectLabel)
  const hasGrades = Object.values(gradeMap).some(v => v !== null)

  const load = useCallback(async () => {
    if (!id || isNaN(id)) return
    setLoading(true)
    setError(false)
    try {
      const p = await fetchProverbById(id)
      setProverb(p)
      try {
        const multi = await fetchProverbPinyinByDialect(id)
        setPinyinByDialect(multi)
      } catch {
        setPinyinByDialect([])
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Fetch corpus texts related to this proverb
  useEffect(() => {
    if (!proverb) return
    fetchCorpusTexts({ q: proverb.title, limit: 3 })
      .then(r => setCorpusItems(r.items))
      .catch(() => setCorpusItems([]))
  }, [proverb])

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-4">
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            <ContentCard variant="hero" padding="lg" className="space-y-4">
              <div className="h-8 w-2/3 mx-auto rounded bg-muted animate-pulse" />
              <div className="h-5 w-1/2 mx-auto rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </ContentCard>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !proverb) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <BackLink href="/" label="每日一句" className="mb-6" />
          <div className="text-center py-16 text-muted-foreground">
            無法載入例句資料，請稍後再試。
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back link */}
        <BackLink href="/" label="每日一句" className="mb-6" />

        {/* Header card */}
        <ContentCard variant="hero" padding="lg" className="space-y-5 mb-6">
          {/* Category + certification badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {proverb.category && (
              <TagPill label={proverb.category} />
            )}
            <CertifiedBadge />
            {gradeLoaded && highestGrade && (
              <GradeBadge grade={highestGrade} />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-serif font-bold text-foreground leading-tight text-center">
            {proverb.title}
          </h1>

          {/* Multi-dialect pills + pinyin */}
          <DialectPinyinSwitcher
            pinyinByDialect={pinyinByDialect}
            activeDialect={activeDialect}
            onSelect={setActiveDialect}
            size="sm"
          />

          {/* Fallback single pinyin */}
          {pinyinByDialect.length === 0 && proverb.pinyin && (
            <p className="text-center">
              <PinyinText value={proverb.pinyin} size="md" tracking="widest" />
            </p>
          )}

          {/* Divider: 華語對譯 */}
          {proverb.definition && (
            <div className="space-y-1.5">
              <LabeledDivider label="華語對譯" />
              <p className="text-sm text-foreground/80 leading-relaxed text-center">{proverb.definition}</p>
            </div>
          )}

          {/* Divider: 例句 */}
          {proverb.example && (
            <div className="space-y-1.5">
              <LabeledDivider label="例句" />
              <p className="text-sm text-muted-foreground italic leading-relaxed text-center">{proverb.example}</p>
            </div>
          )}

          {/* Divider: 詞彙認證分級 */}
          <div className="space-y-2">
            <LabeledDivider label="詞彙認證分級" />
            {!gradeLoaded ? (
              <div className="flex justify-center gap-2">
                {titleChars.slice(0, 4).map((_, i) => (
                  <div key={i} className="h-6 w-8 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : hasGrades ? (
              <div className="flex flex-wrap justify-center gap-2">
                {titleChars.map((char, i) => (
                  <InlineWordGrade key={i} word={char} grade={gradeMap[char] ?? null} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                詞彙分級資料載入中，待客委會認證詞彙資料匯入後顯示
              </p>
            )}
          </div>
        </ContentCard>

        {/* Corpus usage section */}
        <div className="space-y-3">
          <SectionHeader
            title="在語料庫中的使用"
            icon={BookOpen}
            variant="section"
            hakka={false}
            action={
              <Link href={`/corpus?q=${encodeURIComponent(proverb.title)}`}
                className="text-xs text-primary hover:underline underline-offset-2">
                查看全部語料
              </Link>
            }
          />

          {corpusItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">語料庫中暫無相關文本</p>
          ) : (
            <div className="space-y-2">
              {corpusItems.map(item => (
                <Link
                  key={item.id}
                  href={`/corpus/${encodeURIComponent(item.id)}`}
                  className="block"
                >
                  <ContentCard variant="compact" padding="md" hoverable>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {item.genre && <TagPill label={item.genre} />}
                      {item.dialect && <TagPill label={item.dialect} />}
                      {item.word_count != null && (
                        <span className="text-[11px] text-muted-foreground ml-auto">{item.word_count} 字</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1">{item.title}</h3>
                    {item.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                        {item.summary}
                      </p>
                    )}
                  </ContentCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
