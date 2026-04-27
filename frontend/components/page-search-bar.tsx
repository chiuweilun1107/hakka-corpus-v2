'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mic, Camera, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePinyinSuggest } from '@/lib/hooks/use-pinyin-suggest'
import { PinyinSuggestPanel } from '@/components/ui/pinyin-suggest-panel'

interface PageSearchBarProps {
  defaultQuery?: string
  targetPath?: string
}

export function PageSearchBar({ defaultQuery = '', targetPath = '/cooccurrence' }: PageSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    setIsTyping(false)
    setQuery(defaultQuery)
  }, [defaultQuery])

  const { mode, hanziItems, pinyinGroups, showPanel, setShowPanel, containerRef } = usePinyinSuggest(query, isTyping)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`${targetPath}?q=${encodeURIComponent(query.trim())}`)
  }

  const handleSelect = (word: string) => {
    setQuery(word)
    setShowPanel(false)
    router.push(`${targetPath}?q=${encodeURIComponent(word)}`)
  }

  return (
    <div className="bg-hakka-light-brown">
      <div className="container mx-auto px-4 py-4">
        <div ref={containerRef} className="relative max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 shadow-md ring-1 ring-black/5">
              <Search className="h-4.5 w-4.5 text-hakka-light-brown/70 shrink-0" />
              <Input
                type="text"
                placeholder="請輸入客語關鍵詞..."
                value={query}
                onChange={(e) => { setIsTyping(true); setQuery(e.target.value) }}
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
          {showPanel && (
            <PinyinSuggestPanel
              mode={mode}
              hanziItems={hanziItems}
              pinyinGroups={pinyinGroups}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>
    </div>
  )
}
