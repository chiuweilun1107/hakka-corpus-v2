'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchPinyinRecommend, type PinyinRecommendResponse } from '@/lib/api'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { HakkaLabel } from '@/components/ui/hakka-label'


export function HeroSection() {
  const [searchMode, setSearchMode] = useState<'simple' | 'cooccurrence'>('simple')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchQuery2, setSearchQuery2] = useState('美食')
  const [distance, setDistance] = useState('5')
  const [corpusType, setCorpusType] = useState('written')
  const t = useTranslations('hero')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) {
      toast.error(t('toast.emptyKeyword'))
      return
    }
    window.location.href = `/sketch?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <>
      {/* Spacer for fixed header (mobile only) */}
      <div className="h-16 lg:hidden" />

      {/* === MOBILE + TABLET (<1024px) === */}
      <section className="lg:hidden bg-hakka-light-brown px-5 sm:px-8 pt-6 pb-10">
        <SearchPanel
          searchMode={searchMode} setSearchMode={setSearchMode}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          searchQuery2={searchQuery2} setSearchQuery2={setSearchQuery2}
          distance={distance} setDistance={setDistance}
          corpusType={corpusType} setCorpusType={setCorpusType}
          onSearch={handleSearch}
          descText={t('searchForm.hint')}
        />
      </section>

      {/* === DESKTOP (>=1024px): 全幅置中 === */}
      <section className="hidden lg:flex flex-col bg-hakka-light-brown" style={{ minHeight: '100svh' }}>
        <div className="h-16 flex-shrink-0" />
        <div className="flex-1 flex items-center justify-center px-12 py-12">
          <div className="w-full max-w-xl xl:max-w-2xl">
            <SearchPanel
              searchMode={searchMode} setSearchMode={setSearchMode}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              searchQuery2={searchQuery2} setSearchQuery2={setSearchQuery2}
              distance={distance} setDistance={setDistance}
              corpusType={corpusType} setCorpusType={setCorpusType}
              onSearch={handleSearch}
              descText={t('searchForm.hint')}
            />
          </div>
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
}: SearchPanelProps) {
  const t = useTranslations('hero')
  const [pinyinData, setPinyinData] = useState<PinyinRecommendResponse | null>(null)
  const [showPinyin, setShowPinyin] = useState(false)
  const [pinyinQuery, setPinyinQuery] = useState('')
  const isUserTyping = useRef(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pinyinQuery || !isUserTyping.current) { setPinyinData(null); return }
    const timer = setTimeout(() => {
      fetchPinyinRecommend(pinyinQuery)
        .then((data) => {
          if (data?.items?.length > 0) { setPinyinData(data); setShowPinyin(true) }
          else setPinyinData(null)
        })
        .catch(() => setPinyinData(null))
    }, 300)
    return () => clearTimeout(timer)
  }, [pinyinQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowPinyin(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dedupedItems = pinyinData?.items.reduce<typeof pinyinData.items>((acc, item) => {
    const existing = acc.find(i => i.word === item.word)
    if (existing) {
      const seen = new Set(existing.dialects.map(d => d.dialect))
      item.dialects.forEach(d => { if (!seen.has(d.dialect)) existing.dialects.push(d) })
    } else {
      acc.push({ ...item, dialects: [...item.dialects] })
    }
    return acc
  }, []) ?? []

  return (
    <div className="animate-in fade-in duration-500">
      {/* Title group */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
          <HakkaLabel text={t('title')} />
        </h1>
        <p className="text-xs lg:text-sm text-white/60 mt-2 leading-relaxed">
          {descText}
        </p>
      </div>

      <div>
        {/* Underline-style mode tabs */}
        <Tabs
          value={searchMode}
          onValueChange={(v) => setSearchMode(v as 'simple' | 'cooccurrence')}
          className="mb-5"
        >
          <TabsList className="bg-transparent gap-5 p-0 h-auto">
            <TabsTrigger
              value="simple"
              className="pb-1.5 px-0 text-sm font-bold transition-all bg-transparent rounded-none border-b-2 shadow-none data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-transparent data-[state=inactive]:text-white/40 hover:data-[state=inactive]:text-white/70"
            >
              {t('tabs.general')}
            </TabsTrigger>
            <TabsTrigger
              value="cooccurrence"
              className="pb-1.5 px-0 text-sm font-bold transition-all bg-transparent rounded-none border-b-2 shadow-none data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=inactive]:border-transparent data-[state=inactive]:text-white/40 hover:data-[state=inactive]:text-white/70"
            >
              {t('tabs.cooccurrence')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div ref={searchRef} className="relative">
        <form className="space-y-3" onSubmit={onSearch}>
          {searchMode === 'simple' ? (
            /* Search input + corpus type merged into one row */
            <div className="flex items-center bg-white rounded-xl shadow-md ring-1 ring-black/5">
              <Search className="h-4 w-4 text-hakka-light-brown/70 shrink-0 ml-4" />
              <Input
                type="text" placeholder={t('searchForm.placeholder')}
                value={searchQuery} onChange={(e) => { isUserTyping.current = true; setPinyinQuery(e.target.value); setSearchQuery(e.target.value) }}
                className="h-11 flex-1 border-0 bg-transparent text-sm text-gray-900 focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium"
              />
              <div className="h-6 w-px bg-gray-200 shrink-0" />
              <Select value={corpusType} onValueChange={setCorpusType}>
                <SelectTrigger className="h-11 w-[110px] border-0 bg-transparent text-xs text-gray-500 font-medium focus:ring-0 rounded-none rounded-r-xl">
                  <SelectValue placeholder={t('searchForm.type')} />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-white">
                  <SelectItem value="written">{t('searchForm.written')}</SelectItem>
                  <SelectItem value="oral">{t('searchForm.oral')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center bg-white rounded-xl shadow-md ring-1 ring-black/5">
                <Search className="h-4 w-4 text-hakka-light-brown/70 shrink-0 ml-4" />
                <Input placeholder={t('searchForm.coword1')} value={searchQuery} onChange={(e) => { isUserTyping.current = true; setPinyinQuery(e.target.value); setSearchQuery(e.target.value) }}
                  className="h-11 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium" />
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <Input placeholder={t('searchForm.coword2')} value={searchQuery2} onChange={(e) => { isUserTyping.current = true; setPinyinQuery(e.target.value); setSearchQuery2(e.target.value) }}
                  className="h-11 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium" />
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <Select value={corpusType} onValueChange={setCorpusType}>
                  <SelectTrigger className="h-11 w-[110px] border-0 bg-transparent text-xs text-gray-500 font-medium focus:ring-0 rounded-none rounded-r-xl">
                    <SelectValue placeholder={t('searchForm.type')} />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white">
                    <SelectItem value="written">{t('searchForm.written')}</SelectItem>
                    <SelectItem value="oral">{t('searchForm.oral')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-white/15">
                <ArrowRightLeft className="h-3.5 w-3.5 text-white/60" />
                <span className="text-white/80 text-xs font-bold whitespace-nowrap">{t('searchForm.distanceLabel')}</span>
                <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)}
                  className="h-7 w-14 bg-white rounded-lg border-0 text-center text-xs font-bold" />
                <span className="text-white/60 text-[10px]">{t('searchForm.distanceUnit')}</span>
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-bold bg-hakka-dark-teal text-white hover:bg-hakka-dark-teal/90 transition-all shadow-lg border-0"
            >
              <HakkaLabel text={t('searchForm.submit')} />
            </Button>
          </div>
        </form>

        {/* Pinyin dropdown */}
        {showPinyin && dedupedItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-3 z-50">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('pinyin.recommend')}</div>
            <div className="space-y-2">
              {dedupedItems.map((item) => (
                <div key={item.word} className="space-y-1">
                  <div className="text-sm font-bold text-foreground">{item.word}</div>
                  <div className="flex flex-wrap gap-1">
                    {item.dialects.map((d, di) => (
                      <span key={`${d.dialect}-${di}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-xs">
                        <span className="font-semibold text-primary">{d.dialect}</span>
                        <span className="text-gray-500 font-mono">{d.pinyin_full}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Stats + Trending + Suggestions (outside the card) */}
      <HeroPanelExtras onSearch={(q) => { setSearchQuery(q); }} />
    </div>
  )
}

/* === 搜尋面板下方的統計、熱門查詢、推薦 === */
function HeroPanelExtras({ onSearch }: { onSearch: (q: string) => void }) {
  const t = useTranslations('hero')
  const [stats, setStats] = useState<{ dict_count: number; cooc_count: number; pinyin_count: number } | null>(null)
  const [trending, setTrending] = useState<Array<{ word: string; count: number }>>([])

  useEffect(() => {
    fetch('/api/v1/stats/overview').then(r => r.json()).then(setStats).catch(() => {})
    fetch('/api/v1/stats/trending?period=monthly&limit=6').then(r => r.json())
      .then(d => setTrending(d?.items ?? []))
      .catch(() => {})
  }, [])

  const suggestions = t.raw('popularSearch.items') as string[]

  return (
    <>
      {/* Mini stats */}
      {stats && (
        <div className="mt-6 pt-5 border-t border-white/15">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: stats.dict_count ?? 0, label: t('popularSearch.labels.entry') },
              { value: stats.cooc_count ?? 0, label: t('popularSearch.labels.coword') },
              { value: stats.pinyin_count ?? 0, label: t('popularSearch.labels.pinyin') },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/8 rounded-lg px-3 py-2 text-center">
                <div className="text-white/90 text-base font-extrabold tabular-nums leading-none">{(value ?? 0).toLocaleString()}</div>
                <div className="text-white/45 text-[11px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mt-5">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">{t('popularSearch.title')}</div>
          <div className="flex flex-wrap gap-1.5">
            {trending.map(item => (
              <Button
                key={item.word}
                variant="ghost"
                size="sm"
                onClick={() => { onSearch(item.word); window.location.href = `/sketch?q=${encodeURIComponent(item.word)}` }}
                className="px-2.5 py-1 h-auto rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 hover:text-white"
              >
                {item.word}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">{t('popularSearch.trySuggestions')}</div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(s => (
            <Button
              key={s}
              variant="ghost"
              size="sm"
              onClick={() => { onSearch(s); window.location.href = `/sketch?q=${encodeURIComponent(s)}` }}
              className="px-2.5 py-1 h-auto rounded-lg border border-white/15 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/90"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    </>
  )
}
