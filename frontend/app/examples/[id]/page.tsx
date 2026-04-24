'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { PageLayout } from '@/components/page-layout'
import { CertifiedBadge, GradeBadge, InlineWordGrade, TagPill } from '@/components/ui/grade-badge'
import {
  fetchProverbById,
  fetchProverbPinyinByDialect,
  fetchCertifiedVocabBatch,
  fetchCorpusTexts,
} from '@/lib/api'
import type { ProverbItem, PinyinByDialect, CorpusTextSummary } from '@/lib/api'
import { useExploreStore } from '@/lib/stores/explore-store'
import { DialectPillGroup } from '@/components/ui/dialect-pill'
import type { Dialect } from '@/lib/types'

const DB_LABEL_TO_DIALECT: Record<string, Dialect> = {
  '四縣': 'sixian',
  '南四縣': 'sihai',
  '海陸': 'hailu',
  '大埔': 'dapu',
  '饒平': 'raoping',
  '詔安': 'zhaoan',
}

const GRADE_ORDER = ['高級', '中高級', '中級', '初級', '基礎級']

function getHighestGrade(gradeMap: Record<string, string | null>): string | null {
  let top: string | null = null
  for (const grade of Object.values(gradeMap)) {
    if (!grade) continue
    const idx = GRADE_ORDER.indexOf(grade)
    const topIdx = top ? GRADE_ORDER.indexOf(top) : 999
    if (idx !== -1 && idx < topIdx) top = grade
  }
  return top
}

export default function ExampleDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const { activeDialect, setActiveDialect } = useExploreStore()

  const [proverb, setProverb] = useState<ProverbItem | null>(null)
  const [pinyinByDialect, setPinyinByDialect] = useState<PinyinByDialect[]>([])
  const [gradeMap, setGradeMap] = useState<Record<string, string | null>>({})
  const [gradeLoaded, setGradeLoaded] = useState(false)
  const [corpusItems, setCorpusItems] = useState<CorpusTextSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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

  // Fetch vocab grades after proverb loads
  useEffect(() => {
    if (!proverb) return
    const chars = [...proverb.title].filter(c => /[一-鿿]/.test(c))
    if (chars.length === 0) {
      setGradeLoaded(true)
      return
    }
    const dialectLabel = Object.keys(DB_LABEL_TO_DIALECT).find(
      k => DB_LABEL_TO_DIALECT[k] === activeDialect
    )
    fetchCertifiedVocabBatch(chars, dialectLabel)
      .then(results => {
        const map: Record<string, string | null> = {}
        results.forEach(r => {
          map[r.word] = r.grade
        })
        setGradeMap(map)
        setGradeLoaded(true)
      })
      .catch(() => {
        setGradeLoaded(true)
      })
  }, [proverb, activeDialect])

  // Fetch corpus texts related to this proverb
  useEffect(() => {
    if (!proverb) return
    fetchCorpusTexts({ q: proverb.title, limit: 3 })
      .then(r => setCorpusItems(r.items))
      .catch(() => setCorpusItems([]))
  }, [proverb])

  const uniqueDialects = Array.from(
    new Map(pinyinByDialect.map(p => [p.dialect, p])).values()
  )

  const activePinyin = uniqueDialects.find(
    p => DB_LABEL_TO_DIALECT[p.dialect] === activeDialect
  )

  const highestGrade = getHighestGrade(gradeMap)
  const hasGrades = Object.values(gradeMap).some(v => v !== null)

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-4">
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
            <div className="bg-card rounded-2xl px-8 py-7 space-y-4 shadow-sm">
              <div className="h-8 w-2/3 mx-auto rounded bg-muted animate-pulse" />
              <div className="h-5 w-1/2 mx-auto rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !proverb) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft size={14} />
            每日一句
          </Link>
          <div className="text-center py-16 text-muted-foreground">
            無法載入例句資料，請稍後再試。
          </div>
        </div>
      </PageLayout>
    )
  }

  const titleChars = [...proverb.title].filter(c => /[一-鿿]/.test(c))

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft size={14} />
          每日一句
        </Link>

        {/* Header card */}
        <div className="bg-card rounded-2xl px-8 py-7 space-y-5 shadow-sm border border-border/50 mb-6">
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

          {/* Multi-dialect pills */}
          {uniqueDialects.length > 0 && (
            <div className="space-y-2">
              <DialectPillGroup
                dialects={uniqueDialects.map(p => p.dialect)}
                activeDialect={activeDialect}
                onSelect={setActiveDialect}
              />
              <div className="flex items-baseline justify-center">
                {activePinyin ? (
                  <span className="text-sm font-mono text-primary/80 tracking-wider break-all max-w-3xl text-center">
                    {activePinyin.pinyin_full}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">選擇腔調查看發音</span>
                )}
              </div>
            </div>
          )}

          {/* Fallback single pinyin */}
          {uniqueDialects.length === 0 && proverb.pinyin && (
            <p className="text-center text-base text-primary/80 font-mono tracking-widest">
              {proverb.pinyin}
            </p>
          )}

          {/* Divider: 華語對譯 */}
          {proverb.definition && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[11px] text-muted-foreground/70 font-medium px-1">華語對譯</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed text-center">{proverb.definition}</p>
            </div>
          )}

          {/* Divider: 例句 */}
          {proverb.example && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[11px] text-muted-foreground/70 font-medium px-1">例句</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed text-center">{proverb.example}</p>
            </div>
          )}

          {/* Divider: 詞彙認證分級 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[11px] text-muted-foreground/70 font-medium px-1">詞彙認證分級</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
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
        </div>

        {/* Corpus usage section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen size={15} className="text-primary" />
              在語料庫中的使用
            </h2>
            <Link
              href={`/corpus?q=${encodeURIComponent(proverb.title)}`}
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              查看全部語料
            </Link>
          </div>

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
                  <div className="bg-card border border-border/50 rounded-xl px-5 py-3.5 hover:border-primary/40 hover:shadow-sm transition-all">
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
