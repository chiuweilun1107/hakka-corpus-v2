'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { HakkaLabel } from '@/components/ui/hakka-label'
import { CultureHub } from '@/components/culture-hub'
import { usePinyinSuggest } from '@/lib/hooks/use-pinyin-suggest'
import { PinyinSuggestPanel } from '@/components/ui/pinyin-suggest-panel'

const QUICK_EXPLORE = ['美食', '節慶', '客家話', '山歌']

export function SearchSection() {
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
    window.location.href = `/cooccurrence?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <>
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

      {/* === MOBILE + TABLET CultureHub (<1024px) === */}
      <section className="lg:hidden border-t border-border/20">
        <div className="container mx-auto px-4 max-w-2xl py-8">
          <CultureHub inline />
        </div>
      </section>

      {/* === DESKTOP (>=1024px): 左右兩欄分色 === */}
      <section className="hidden lg:block bg-muted/30 border-t border-border/20">
        <div className="container mx-auto px-4 max-w-6xl py-12">
          <div className="grid grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr] rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
            {/* Left column: search on deep brown */}
            <div className="bg-hakka-light-brown flex items-start px-10 xl:px-14 py-12">
              <div className="w-full">
                <SearchPanel
                  searchMode={searchMode} setSearchMode={setSearchMode}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  searchQuery2={searchQuery2} setSearchQuery2={setSearchQuery2}
                  distance={distance} setDistance={setDistance}
                  corpusType={corpusType} setCorpusType={setCorpusType}
                  onSearch={handleSearch}
                  descText={t('searchForm.hint')}
                  showQuickExplore
                />
              </div>
            </div>

            {/* Right column: CultureHub (inline, no section wrapper) */}
            <div className="bg-hakka-warm-white overflow-y-auto no-scrollbar px-10 xl:px-16 py-12">
              <CultureHub inline />
            </div>
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
  showQuickExplore?: boolean
}

function SearchPanel({
  searchMode, setSearchMode,
  searchQuery, setSearchQuery,
  searchQuery2, setSearchQuery2,
  distance, setDistance,
  corpusType, setCorpusType,
  onSearch,
  descText,
  showQuickExplore = false,
}: SearchPanelProps) {
  const t = useTranslations('hero')
  const [isTyping, setIsTyping] = useState(false)
  const { dedupedItems, showPanel, containerRef } = usePinyinSuggest(searchQuery, isTyping)

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

        <div ref={containerRef} className="relative">
        <form className="space-y-3" onSubmit={onSearch}>
          {searchMode === 'simple' ? (
            <div className="flex items-center bg-white rounded-xl shadow-md ring-1 ring-black/5">
              <Search className="h-4 w-4 text-hakka-light-brown/70 shrink-0 ml-4" />
              <Input
                type="text" placeholder={t('searchForm.placeholder')}
                value={searchQuery} onChange={(e) => { setIsTyping(true); setSearchQuery(e.target.value) }}
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
                <Input placeholder={t('searchForm.coword1')} value={searchQuery} onChange={(e) => { setIsTyping(true); setSearchQuery(e.target.value) }}
                  className="h-11 flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 px-3 placeholder:text-gray-400 font-medium" />
                <div className="h-6 w-px bg-gray-200 shrink-0" />
                <Input placeholder={t('searchForm.coword2')} value={searchQuery2} onChange={(e) => setSearchQuery2(e.target.value)}
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
        {showPanel && <PinyinSuggestPanel items={dedupedItems} />}
        </div>

        {/* Quick explore chips (desktop only) */}
        {showQuickExplore && (
          <div className="pt-5">
            <p className="text-[11px] text-white/50 tracking-widest uppercase mb-2">快速探索</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_EXPLORE.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => { window.location.href = `/cooccurrence?q=${encodeURIComponent(word)}` }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
