'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Search, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// Tabs import removed -- SearchPanel now uses plain underline-style buttons
import { DIALECTS } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const InteractiveMap = dynamic(() => import('./interactive-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#fdfaf5] animate-pulse" />
})

const DIALECT_COLORS: Record<string, string> = {
  sixian: 'bg-[#009688]',
  hailu: 'bg-[#4CAF50]',
  dapu: 'bg-[#E91E63]',
  raoping: 'bg-[#FF9800]',
  zhaoan: 'bg-[#3F51B5]',
  sihai: 'bg-[#03A9F4]',
}

export function HeroSection() {
  const [searchMode, setSearchMode] = useState<'simple' | 'cooccurrence'>('simple')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchQuery2, setSearchQuery2] = useState('美食')
  const [distance, setDistance] = useState('5')
  const [corpusType, setCorpusType] = useState('written')
  const [dialect, setDialect] = useState<string>('sixian')
  const [selectedDialects, setSelectedDialects] = useState<Set<string>>(
    new Set(DIALECTS.map(d => d.id))
  )

  const handleDialectToggle = (id: string) => {
    setSelectedDialects(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) {
      toast.error("請輸入關鍵字")
      return
    }
    window.location.href = `/sketch?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <>
      {/* Spacer for fixed header (mobile only, desktop handles via padding) */}
      <div className="h-16 lg:hidden" />

      {/* === MOBILE + TABLET (<1024px): 上下堆疊 === */}
      <section className="lg:hidden">
        {/* 搜尋面板 */}
        <div className="bg-hakka-light-brown px-5 sm:px-8 pt-6 pb-6">
          <SearchPanel
            searchMode={searchMode} setSearchMode={setSearchMode}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchQuery2={searchQuery2} setSearchQuery2={setSearchQuery2}
            distance={distance} setDistance={setDistance}
            corpusType={corpusType} setCorpusType={setCorpusType}
            onSearch={handleSearch}
            descText="輸入關鍵詞檢索語料，或點擊地圖探索腔調分佈"
          />
          {/* 腔調選擇（多選） */}
          <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-white/15">
            {DIALECTS.map(d => (
              <button
                key={d.id}
                onClick={() => handleDialectToggle(d.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all",
                  selectedDialects.has(d.id)
                    ? "bg-white/25 text-white"
                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", DIALECT_COLORS[d.id])} />
                {d.name}
              </button>
            ))}
          </div>
        </div>
        {/* 地圖（固定高度，避免 Leaflet 撐爆） */}
        <div style={{ height: '400px', position: 'relative' }}>
          <InteractiveMap selectedDialects={selectedDialects} onDialectToggle={handleDialectToggle} />
        </div>
      </section>

      {/* === DESKTOP (>=1024px): 左右分離 === */}
      <section className="hidden lg:flex pt-16" style={{ height: '100svh' }}>
        {/* 左側搜尋面板 */}
        <div className="w-[440px] xl:w-[480px] flex-shrink-0 bg-hakka-light-brown flex flex-col justify-start overflow-y-auto px-10 xl:px-12 py-10">
          <SearchPanel
            searchMode={searchMode} setSearchMode={setSearchMode}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            searchQuery2={searchQuery2} setSearchQuery2={setSearchQuery2}
            distance={distance} setDistance={setDistance}
            corpusType={corpusType} setCorpusType={setCorpusType}
            onSearch={handleSearch}
            descText="輸入關鍵詞檢索語料，或點擊地圖探索腔調分佈"
          />
        </div>
        {/* 右側地圖 */}
        <div className="flex-1 relative overflow-hidden">
          <InteractiveMap selectedDialects={selectedDialects} onDialectToggle={handleDialectToggle} />
        </div>
      </section>
    </>
  )
}

/* === 搜尋面板元件 === */
interface SearchPanelProps {
  searchMode: 'simple' | 'cooccurrence'
  setSearchMode: (v: 'simple' | 'cooccurrence') => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  searchQuery2: string
  setSearchQuery2: (v: string) => void
  distance: string
  setDistance: (v: string) => void
  corpusType: string
  setCorpusType: (v: string) => void
  dialect: string
  setDialect: (v: string) => void
  onSearch: (e: React.FormEvent) => void
  descText: string
}

function SearchPanel({
  searchMode, setSearchMode,
  searchQuery, setSearchQuery,
  searchQuery2, setSearchQuery2,
  distance, setDistance,
  corpusType, setCorpusType,
  onSearch,
  descText,
}: Omit<SearchPanelProps, 'dialect' | 'setDialect'>) {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Title group */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
          探索客語世界
        </h1>
        <p className="text-xs lg:text-sm text-white/60 mt-2 leading-relaxed">
          {descText}
        </p>
      </div>

      <div>
        {/* Underline-style mode tabs */}
        <div className="flex gap-5 mb-5">
          <button
            type="button"
            onClick={() => setSearchMode('simple')}
            className={cn(
              "pb-1.5 text-sm font-bold transition-all",
              searchMode === 'simple'
                ? "text-white border-b-2 border-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            一般檢索
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('cooccurrence')}
            className={cn(
              "pb-1.5 text-sm font-bold transition-all",
              searchMode === 'cooccurrence'
                ? "text-white border-b-2 border-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            共現詞檢索
          </button>
        </div>

        <form className="space-y-3" onSubmit={onSearch}>
          {searchMode === 'simple' ? (
            /* Search input + corpus type merged into one row */
            <div className="flex items-center bg-white rounded-xl shadow-md ring-1 ring-black/5">
              <Search className="h-4 w-4 text-hakka-light-brown/70 shrink-0 ml-4" />
              <Input
                type="text" placeholder="請輸入關鍵字..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 flex-1 border-0 bg-transparent text-sm text-gray-900 focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium"
              />
              <div className="h-6 w-px bg-gray-200 shrink-0" />
              <Select value={corpusType} onValueChange={setCorpusType}>
                <SelectTrigger className="h-11 w-[110px] border-0 bg-transparent text-xs text-gray-500 font-medium focus:ring-0 rounded-none rounded-r-xl">
                  <SelectValue placeholder="語料類型" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  <SelectItem value="written">書面語料</SelectItem>
                  <SelectItem value="oral">口語語料</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center bg-white rounded-xl shadow-md ring-1 ring-black/5">
                <Search className="h-4 w-4 text-hakka-light-brown/70 shrink-0 ml-4" />
                <Input placeholder="詞彙一" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium" />
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <Input placeholder="詞彙二" value={searchQuery2} onChange={(e) => setSearchQuery2(e.target.value)}
                  className="h-11 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium" />
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <Select value={corpusType} onValueChange={setCorpusType}>
                  <SelectTrigger className="h-11 w-[110px] border-0 bg-transparent text-xs text-gray-500 font-medium focus:ring-0 rounded-none rounded-r-xl">
                    <SelectValue placeholder="語料類型" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white">
                    <SelectItem value="written">書面語料</SelectItem>
                    <SelectItem value="oral">口語語料</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/15">
                <ArrowRightLeft className="h-3.5 w-3.5 text-white/60" />
                <span className="text-white/80 text-xs font-bold whitespace-nowrap">間距：</span>
                <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)}
                  className="h-7 w-14 bg-white rounded-lg border-0 text-center text-xs font-bold" />
                <span className="text-white/60 text-[10px]">詞</span>
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-bold bg-[#1a5c5e] text-white hover:bg-[#0d4d4f] transition-all shadow-lg border-0"
            >
              開始檢索
            </Button>
          </div>
        </form>
      </div>

      {/* Stats + Trending + Suggestions (outside the card) */}
      <HeroPanelExtras onSearch={(q) => { setSearchQuery(q); }} />
    </div>
  )
}

/* === 搜尋面板下方的統計、熱門查詢、推薦 === */
function HeroPanelExtras({ onSearch }: { onSearch: (q: string) => void }) {
  const [stats, setStats] = useState<{ dict_count: number; cooc_count: number; pinyin_count: number } | null>(null)
  const [trending, setTrending] = useState<Array<{ word: string; count: number }>>([])

  useEffect(() => {
    fetch('/api/v1/stats/overview').then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/v1/stats/trending?period=monthly&limit=6').then(r => r.json())
      .then(d => setTrending(d?.items ?? []))
      .catch(() => {})
  }, [])

  const suggestions = ['山歌', '擂茶', '天光日', '義民', '粄條', '油桐花']

  return (
    <>
      {/* Mini stats */}
      {stats && (
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="flex items-center gap-4 text-white/50 text-[11px]">
            <span><strong className="text-white/80 text-sm">{stats.dict_count.toLocaleString()}</strong> 詞條</span>
            <span className="text-white/20">|</span>
            <span><strong className="text-white/80 text-sm">{stats.cooc_count.toLocaleString()}</strong> 共現詞</span>
            <span className="text-white/20">|</span>
            <span><strong className="text-white/80 text-sm">{stats.pinyin_count.toLocaleString()}</strong> 拼音</span>
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">熱門查詢</div>
          <div className="flex flex-wrap gap-1.5">
            {trending.map(t => (
              <button
                key={t.word}
                onClick={() => { onSearch(t.word); window.location.href = `/sketch?q=${encodeURIComponent(t.word)}` }}
                className="px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 hover:text-white transition-colors"
              >
                {t.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-4">
        <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">試試看</div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { onSearch(s); window.location.href = `/sketch?q=${encodeURIComponent(s)}` }}
              className="px-2.5 py-1 rounded-lg border border-white/15 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/90 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
