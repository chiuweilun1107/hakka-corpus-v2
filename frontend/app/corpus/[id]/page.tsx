'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Volume2, Copy, ExternalLink, BookOpen } from 'lucide-react'
import { PageLayout } from '@/components/page-layout'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OriginalReader, type EntityType } from '@/components/corpus/original-reader'
import { AnalysisSidebar } from '@/components/corpus/analysis-sidebar'
import { fetchCorpusTextDetail, type CorpusTextDetail } from '@/lib/api'

type ActiveHighlight = { words: string[]; type: EntityType } | null

export default function CorpusDetailPage() {
  const params = useParams()
  const id = decodeURIComponent(params.id as string)
  const [data, setData] = useState<CorpusTextDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeHighlight, setActiveHighlight] = useState<ActiveHighlight>(null)

  useEffect(() => {
    fetchCorpusTextDetail(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleHighlight = (words: string[], type: EntityType) => {
    setActiveHighlight({ words, type })
  }
  const handleClearHighlight = () => setActiveHighlight(null)

  if (loading) {
    return (
      <PageLayout>
        <LoadingState message="載入語料中…" />
      </PageLayout>
    )
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-6">
          <EmptyState title="找不到該語料" description="請確認連結或返回列表重新選擇" />
          <div className="text-center mt-4">
            <Link href="/corpus">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回語料列表
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  const highlightsForReader = activeHighlight ? [activeHighlight] : []

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <Link href="/corpus">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回語料列表
          </Button>
        </Link>

        {/* Title block */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">客語文本語料</span>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl mb-3">{data.title}</CardTitle>
                <div className="flex gap-2 flex-wrap items-center">
                  {data.genre && <Badge variant="outline">{data.genre}</Badge>}
                  {data.dialect && <Badge variant="secondary">{data.dialect}腔</Badge>}
                  {data.word_count && <Badge variant="outline">{data.word_count} 字</Badge>}
                  {data.source && (
                    <span className="text-xs text-muted-foreground">來源：{data.source}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" disabled title="朗讀（規劃中）">
                  <Volume2 className="h-3.5 w-3.5 mr-1" />
                  朗讀
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${data.title}\n\n${data.content}\n\n來源：${data.source || ''}`)
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  複製
                </Button>
                {data.source_url && (
                  <a href={data.source_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      原始來源
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 左右分欄：原文 + AI 側欄 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          {/* 左：原文 */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    原文閱讀
                  </CardTitle>
                  {activeHighlight && (
                    <Button variant="ghost" size="sm" onClick={handleClearHighlight} className="h-7 text-xs">
                      清除高亮
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <OriginalReader
                  content={data.content}
                  highlights={highlightsForReader}
                  onWordClick={() => handleClearHighlight()}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右：AI 分析側欄 */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <AnalysisSidebar
              data={data}
              onHighlight={handleHighlight}
              onClearHighlight={handleClearHighlight}
              activeHighlight={activeHighlight}
            />
          </aside>
        </div>
      </div>
    </PageLayout>
  )
}
