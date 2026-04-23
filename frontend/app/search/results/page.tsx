'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchPinyinRecommend, type PinyinRecommendResponse } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageLayout } from '@/components/page-layout'
import { LoadingState } from '@/components/loading-state'
import { LAYER1_DATA, LAYER2_DATA, LAYER3_DATA } from '@/lib/mock-data'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [layer, setLayer] = useState<1 | 2 | 3>(1)
  const [selectedWord, setSelectedWord] = useState('美食')
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')

  // Pinyin state
  const [pinyinData, setPinyinData] = useState<PinyinRecommendResponse | null>(null)
  const [showPinyin, setShowPinyin] = useState(false)
  const [pinyinQuery, setPinyinQuery] = useState('')
  const isUserTyping = useRef(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch pinyin on query change
  useEffect(() => {
    if (!isUserTyping.current || !pinyinQuery.trim()) {
      setPinyinData(null)
      setShowPinyin(false)
      return
    }
    fetchPinyinRecommend(pinyinQuery)
      .then((data) => {
        setPinyinData(data)
        setShowPinyin(true)
      })
      .catch(() => {})
  }, [pinyinQuery])

  // Click outside to close pinyin
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowPinyin(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Deduplicate pinyin items by word
  const dedupedItems = pinyinData?.items
    ? Object.values(
        pinyinData.items.reduce<Record<string, (typeof pinyinData.items)[0]>>((acc, item) => {
          if (acc[item.word]) {
            acc[item.word] = {
              ...acc[item.word],
              dialects: [...acc[item.word].dialects, ...item.dialects],
            }
          } else {
            acc[item.word] = { ...item }
          }
          return acc
        }, {})
      )
    : []

  const handleSubmit = () => {
    setShowPinyin(false)
    isUserTyping.current = false
    router.push(`/search/results?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <>
      {/* Secondary search bar — sits below PageLayout header */}
      <div className="bg-hakka-light-brown sticky top-14 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div ref={searchRef} className="relative flex items-center gap-0 flex-1 max-w-2xl">
            <Input
              value={layer === 1 ? keyword : `${keyword}, ${selectedWord}`}
              onChange={(e) => {
                if (layer === 1) {
                  isUserTyping.current = true
                  setKeyword(e.target.value)
                  setPinyinQuery(e.target.value)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="輸入關鍵詞..."
              className="bg-white text-gray-900 h-10 rounded-l-xl rounded-r-none border-0 focus-visible:ring-0"
            />
            <Button
              className="h-10 px-5 rounded-l-none rounded-r-xl bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Pinyin dropdown */}
            {showPinyin && dedupedItems.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {dedupedItems.map((item, idx) => (
                  <button
                    key={`${item.word}-${idx}`}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left text-sm"
                    onClick={() => {
                      setKeyword(item.word)
                      setShowPinyin(false)
                      isUserTyping.current = false
                    }}
                  >
                    <span className="font-medium text-foreground">{item.word}</span>
                    <span className="text-xs text-muted-foreground">{item.dialects.join(' · ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex border border-white/30 rounded-lg overflow-hidden text-sm h-10 shrink-0">
            <Button variant="ghost" className="px-4 bg-white text-primary font-bold rounded-none h-full hover:bg-white/90">
              關鍵詞
            </Button>
            <Button variant="ghost" className="px-4 bg-primary/80 text-white hover:bg-primary rounded-none h-full">
              共現詞
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-muted/20 min-h-screen">
        <div className="container mx-auto flex gap-6 p-6">
          {/* Filter Sidebar */}
          <aside className="w-64 space-y-6 shrink-0">
            <div className="bg-card p-6 border border-border rounded-xl shadow-sm space-y-6">

              <div className="space-y-3">
                <h3 className="font-bold text-sm border-l-4 border-primary pl-2 text-foreground">每頁顯示筆數</h3>
                <div className="flex border border-border rounded-lg overflow-hidden text-xs">
                  <Button variant="ghost" className="flex-1 py-2 h-auto rounded-none border-r text-xs">15</Button>
                  <Button variant="ghost" className="flex-1 py-2 h-auto rounded-none border-r text-xs">30</Button>
                  <Button variant="ghost" className="flex-1 py-2 h-auto rounded-none text-xs">50</Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm border-l-4 border-primary pl-2 text-foreground">跨距</h3>
                <div className="flex gap-2">
                  <Input placeholder="可複選" className="text-xs h-8 flex-1" />
                  <Button size="sm" className="h-8 text-xs px-4">確定</Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="font-bold text-sm border-l-4 border-primary pl-2 text-foreground">腔調</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { name: '四縣腔', count: 194 },
                    { name: '海陸腔', count: 93 },
                    { name: '南四縣腔', count: 45 },
                    { name: '大埔腔', count: 41 },
                    { name: '饒平腔', count: 39 },
                  ].map((d) => (
                    <div key={d.name} className="flex justify-between items-center text-primary hover:underline cursor-pointer group">
                      <span>{d.name}</span>
                      <span className="text-muted-foreground group-hover:text-foreground">({d.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {layer === 1 && (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>共現詞</TableHead>
                      <TableHead className="w-48">總符合筆數</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LAYER1_DATA.map((item, i) => (
                      <TableRow key={i} className="group">
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="text-primary hover:underline font-medium p-0 h-auto"
                            onClick={() => { setLayer(2); setSelectedWord(item.word) }}
                          >
                            {item.word}
                          </Button>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">{item.count.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {layer === 2 && (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>共現詞</TableHead>
                      <TableHead>關鍵詞</TableHead>
                      <TableHead>共現詞</TableHead>
                      <TableHead className="text-center">跨距</TableHead>
                      <TableHead className="text-right">互見訊息值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LAYER2_DATA.map((item, i) => (
                      <TableRow
                        key={i}
                        className="cursor-pointer hover:bg-muted/20"
                        onClick={() => setLayer(3)}
                      >
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="text-primary">{item.word1}</TableCell>
                        <TableCell>{item.keyword}</TableCell>
                        <TableCell className="text-primary">{item.word2}</TableCell>
                        <TableCell className="text-center font-medium">{item.span}</TableCell>
                        <TableCell className="text-right font-medium">{item.miScore.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-border flex items-center justify-center gap-4 text-xs">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">{'<'}</Button>
                  <span className="w-7 h-7 border border-primary text-primary flex items-center justify-center rounded-sm text-xs">1</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">{'>'}</Button>
                  <div className="flex items-center gap-2 ml-4">
                    <span>跳至</span>
                    <Input className="w-10 h-7 p-1 text-center" defaultValue="1" />
                    <span>頁</span>
                    <Button variant="outline" size="sm" className="h-7 px-3">前往</Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Layer 3 Modal */}
      {layer === 3 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-6">
          <div className="bg-card w-full max-w-6xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-4 text-sm">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-2 border border-primary/30">
                  <span className="font-bold">次數：61</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  點擊欲查看的語料可查看該筆語料的詳細資訊
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLayer(2)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <Table className="text-sm">
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16">腔調</TableHead>
                    <TableHead className="text-right pr-8">前文</TableHead>
                    <TableHead className="text-center w-24">關鍵詞</TableHead>
                    <TableHead className="pl-8">後文</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LAYER3_DATA.map((item, i) => (
                    <TableRow key={i} className="hover:bg-muted/20 cursor-pointer">
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-6 h-6 border border-border text-primary rounded-sm text-xs font-bold bg-card">
                          {item.dialect}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8 text-muted-foreground font-serif">{item.left}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-destructive font-bold">{item.keyword}</span>
                      </TableCell>
                      <TableCell className="pl-8 text-foreground font-serif">
                        {item.right.split(' ').map((word, idx) => (
                          <span key={idx} className={word === '美食' ? 'text-primary font-bold mx-1' : ''}>
                            {word}{' '}
                          </span>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function SearchResultsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<LoadingState className="py-40" />}>
        <SearchResultsContent />
      </Suspense>
    </PageLayout>
  )
}
