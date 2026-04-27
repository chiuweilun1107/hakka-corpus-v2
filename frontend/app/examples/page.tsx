'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Quote } from 'lucide-react'
import { PageLayout } from '@/components/page-layout'
import { LoadingState } from '@/components/loading-state'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fetchProverbList, type ProverbItem } from '@/lib/api'

const CATEGORIES = ['全部', '諺語', '歇後語', '佳句']
const DIALECTS = ['全部', '四縣', '海陸', '大埔', '饒平', '詔安', '南四縣']

export default function ExamplesPage() {
  const [items, setItems] = useState<ProverbItem[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('全部')
  const [dialect, setDialect] = useState('全部')

  useEffect(() => {
    setLoading(true)
    fetchProverbList({
      limit: 60,
      category: category === '全部' ? undefined : category,
      dialect: dialect === '全部' ? undefined : dialect,
    })
      .then((r) => {
        setItems(r.items)
        setTotal(r.total)
      })
      .finally(() => setLoading(false))
  }, [category, dialect])

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Quote className="h-6 w-6 text-primary" />
            俚諺語例句庫
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            收錄客語諺語、歇後語與佳句，附拼音對照與白話釋義。
          </p>
          {total !== null && (
            <div className="mt-3">
              <Badge variant="outline" className="text-sm py-1 px-3">
                共 <span className="text-primary font-bold mx-1">{total}</span> 則
              </Badge>
            </div>
          )}
        </div>

        {/* 篩選 */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-muted-foreground font-medium mr-1">類別：</span>
              {CATEGORIES.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? 'default' : 'outline'}
                  onClick={() => setCategory(c)}
                  className="h-7"
                >
                  {c}
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
          </CardContent>
        </Card>

        {/* 列表 */}
        {loading ? (
          <LoadingState message="載入俚諺語中…" />
        ) : items.length === 0 ? (
          <EmptyState title="沒有符合條件的俚諺語" description="試試調整類別或腔調篩選" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/examples/${item.id}`} className="block">
                <Card className="h-full transition hover:border-primary hover:shadow-md cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex gap-2 mb-2 flex-wrap items-center">
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      {item.dialect && (
                        <Badge variant="secondary" className="text-xs">
                          {item.dialect}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold font-serif text-foreground mb-1 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                    {item.pinyin && (
                      <p className="text-xs text-primary/70 mb-2 font-mono tracking-wide line-clamp-1">
                        {item.pinyin}
                      </p>
                    )}
                    {item.definition && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.definition}
                      </p>
                    )}
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
