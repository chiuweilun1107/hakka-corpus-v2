'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mic, Camera, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchPinyinRecommend, type PinyinRecommendResponse } from '@/lib/api'

interface PageSearchBarProps {
  defaultQuery?: string
  targetPath?: string
}

export function PageSearchBar({ defaultQuery = '', targetPath = '/cooccurrence' }: PageSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [pinyinData, setPinyinData] = useState<PinyinRecommendResponse | null>(null)
  const [showPinyin, setShowPinyin] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const isUserTyping = useRef(false)

  useEffect(() => {
    isUserTyping.current = false
    setQuery(defaultQuery)
  }, [defaultQuery])

  useEffect(() => {
    if (!query || query.length < 1 || !isUserTyping.current) {
      setPinyinData(null)
      return
    }
    const timer = setTimeout(() => {
      fetchPinyinRecommend(query)
        .then((data) => {
          if (data?.items && data.items.length > 0) {
            setPinyinData(data)
            setShowPinyin(true)
          } else {
            setPinyinData(null)
          }
        })
        .catch(() => setPinyinData(null))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowPinyin(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setShowPinyin(false)
    router.push(`${targetPath}?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="bg-hakka-light-brown">
      <div className="container mx-auto px-4 py-4">
        <div ref={searchRef} className="relative max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 shadow-md ring-1 ring-black/5">
              <Search className="h-4.5 w-4.5 text-hakka-light-brown/70 shrink-0" />
              <Input
                type="text"
                placeholder="請輸入客語關鍵詞..."
                value={query}
                onChange={(e) => { isUserTyping.current = true; setQuery(e.target.value) }}
                onFocus={() => pinyinData && setShowPinyin(true)}
                className="h-11 border-0 bg-transparent text-base text-gray-900 focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium"
              />
              <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-hakka-light-brown" title="語音輸入">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-hakka-light-brown" title="拍照辨識">
                  <Camera className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-hakka-light-brown" title="OCR 文字辨識">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="h-11 px-6 rounded-xl bg-white text-hakka-light-brown hover:bg-hakka-warm-white hover:shadow-lg font-bold shadow-md ring-1 ring-black/5 transition-all"
            >
              搜尋
            </Button>
          </form>

          {/* Pinyin Panel */}
          {showPinyin && pinyinData && pinyinData.items.length > 0 && (() => {
            // Deduplicate by word, merge dialects
            const dedupedItems = pinyinData.items.reduce<typeof pinyinData.items>((acc, item) => {
              const existing = acc.find(i => i.word === item.word)
              if (existing) {
                const seen = new Set(existing.dialects.map(d => d.dialect))
                item.dialects.forEach(d => { if (!seen.has(d.dialect)) existing.dialects.push(d) })
              } else {
                acc.push({ ...item, dialects: [...item.dialects] })
              }
              return acc
            }, [])
            return (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 z-50">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  客語拼音推薦
                </div>
                <div className="space-y-3">
                  {dedupedItems.map((item) => (
                    <div key={item.word} className="space-y-1.5">
                      <div className="text-base font-bold text-foreground">{item.word}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.dialects.map((d, di) => (
                          <span
                            key={`${d.dialect}-${di}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-xs"
                          >
                            <span className="font-semibold text-primary">{d.dialect}</span>
                            <span className="text-gray-500 font-mono">{d.pinyin_full}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
